import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useWallet } from "../hooks/useWallet";
import { createTopic, signMessage } from "../lib/wallet";
import { showError, showSuccess, getErrorMessage } from "../lib/toast";
import { HashConnectConnectionState } from "hashconnect";
import { API_ENDPOINTS } from "../lib/environment";
import {
  localToUtc,
  isAfterOrEqual,
  formatDateForDateInput,
  formatDateForTimeInput,
  getMinStartDate,
  getMinEndDate,
  getMinEndTime,
} from "../lib/date";
import { isBefore, addHours, addMinutes } from "date-fns";
import {
  START_TO_END_TIME_DIFF_MINUTES,
  DEFAULT_START_TO_END_TIME_DIFF_HOURS,
  MAX_CAMPAIGN_NAME_LENGTH,
  MAX_REQUIREMENT_LENGTH,
} from "../lib/constants";
import { CampaignFormData, CreationStep } from "../lib/interfaces";

export function CreateCampaign() {
  const navigate = useNavigate();
  const { connectionStatus, accountId } = useWallet();

  const defaultStartDate = new Date();
  defaultStartDate.setSeconds(0, 0);
  const defaultEndDate = addHours(
    new Date(defaultStartDate),
    DEFAULT_START_TO_END_TIME_DIFF_HOURS
  );

  const [formData, setFormData] = useState<CampaignFormData>({
    name: "",
    prizePool: 0,
    requirement: "",
    startDate: defaultStartDate,
    endDate: defaultEndDate,
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentStep, setCurrentStep] = useState<CreationStep>(
    CreationStep.IDLE
  );
  const [useCurrentTimeAsStart, setUseCurrentTimeAsStart] = useState(false);

  const isPaired = connectionStatus === HashConnectConnectionState.Paired;

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: name === "prizePool" ? parseFloat(value) || 0 : value,
    });
  };

  const handleDateChange = (
    dateType: "startDate" | "endDate",
    dateValue: string
  ) => {
    if (dateValue) {
      const currentDate =
        dateType === "startDate" ? formData.startDate : formData.endDate;

      if (!currentDate) {
        return;
      }

      // Extract date parts
      const [year, month, day] = dateValue
        .split("-")
        .map((num) => parseInt(num, 10));

      // Create new date with the same time as before
      const newDate = new Date(currentDate);
      newDate.setFullYear(year, month - 1, day); // month of Date object is 0-indexed and that's why we need to subtract 1

      if (dateType === "startDate") {
        if (formData.endDate) {
          // Check if new start date creates a conflict
          if (isAfterOrEqual(newDate, formData.endDate)) {
            // Set end date to 1 minute after new start date
            const newEndDate = addMinutes(
              new Date(newDate),
              START_TO_END_TIME_DIFF_MINUTES
            );

            setFormData({
              ...formData,
              startDate: newDate,
              endDate: newEndDate,
            });

            return;
          }
        }

        setFormData({
          ...formData,
          startDate: newDate,
        });
      } else {
        // For end date
        if (formData.startDate) {
          // Check if new end date creates a conflict
          if (isAfterOrEqual(formData.startDate, newDate)) {
            // Set end date to 1 minute after start date
            const newEndDate = addMinutes(
              new Date(formData.startDate),
              START_TO_END_TIME_DIFF_MINUTES
            );

            setFormData({
              ...formData,
              endDate: newEndDate,
            });

            return;
          }
        }

        setFormData({
          ...formData,
          endDate: newDate,
        });
      }
    }
  };

  const handleTimeChange = (
    dateType: "startTime" | "endTime",
    timeValue: string
  ) => {
    if (timeValue) {
      // Get current date or create a new one
      const currentDate =
        dateType === "startTime" ? formData.startDate : formData.endDate;

      if (!currentDate) {
        return;
      }

      // Extract time parts
      const [hours, minutes] = timeValue
        .split(":")
        .map((num) => parseInt(num, 10));

      // Create new date with the same date but new time
      const newDate = new Date(currentDate);
      newDate.setHours(hours, minutes, 0, 0);

      if (dateType === "startTime") {
        if (formData.endDate) {
          // Check if the new start time creates a conflict
          if (isAfterOrEqual(newDate, formData.endDate)) {
            // Set end date to 1 minute after new start date
            const newEndDate = addMinutes(
              new Date(newDate),
              START_TO_END_TIME_DIFF_MINUTES
            );

            setFormData({
              ...formData,
              startDate: newDate,
              endDate: newEndDate,
            });
            return;
          }
        }

        setFormData({
          ...formData,
          startDate: newDate,
        });
      } else {
        // For end time
        if (formData.startDate) {
          // Check if the new end time creates a conflict
          if (isAfterOrEqual(formData.startDate, newDate)) {
            // Set end date to 1 minute after start date
            const newEndDate = addMinutes(
              new Date(formData.startDate),
              START_TO_END_TIME_DIFF_MINUTES
            );

            setFormData({
              ...formData,
              endDate: newEndDate,
            });
            return;
          }
        }

        setFormData({
          ...formData,
          endDate: newDate,
        });
      }
    }
  };

  const handleUseCurrentTime = () => {
    setUseCurrentTimeAsStart(!useCurrentTimeAsStart);
    if (!useCurrentTimeAsStart) {
      // Round the current time to the nearest minute, removing seconds
      const now = new Date();
      now.setSeconds(0, 0);

      if (formData.endDate) {
        // Check if using current time creates a conflict
        if (isAfterOrEqual(now, formData.endDate)) {
          // Set end date to 1 minute after current time
          const newEndDate = addMinutes(
            new Date(now),
            START_TO_END_TIME_DIFF_MINUTES
          );

          setFormData({
            ...formData,
            startDate: now,
            endDate: newEndDate,
          });
          return;
        }
      }

      setFormData({
        ...formData,
        startDate: now,
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      if (!formData.startDate || !formData.endDate) {
        showError("Please set both start and end dates");
        setIsSubmitting(false);
        return;
      }

      // Validate start date is before end date with full time comparison
      if (!isBefore(formData.startDate, formData.endDate)) {
        showError("Start date must be before end date");
        setIsSubmitting(false);
        return;
      }

      // Step 1: Create a new topic
      setCurrentStep(CreationStep.CREATING_TOPIC);
      const topicResponse = await createTopic();

      if (!topicResponse) {
        // If createTopic returns null, it already showed appropriate error messages
        setIsSubmitting(false);
        setCurrentStep(CreationStep.IDLE);
        return;
      }

      const { topicId, txId } = topicResponse;

      // Convert dates to UTC for backend
      const startDateUTC = localToUtc(formData.startDate);
      const endDateUTC = localToUtc(formData.endDate);

      const message = `${txId}, ${topicId}, ${formData.name}, ${accountId}, ${formData.prizePool}, ${formData.requirement}, ${startDateUTC}, ${endDateUTC}`;

      // Step 2: Sign the message
      setCurrentStep(CreationStep.SIGNING_DATA);
      const signature = await signMessage(message);

      if (!signature) {
        // If signMessage returns null, it already showed appropriate error messages
        setIsSubmitting(false);
        setCurrentStep(CreationStep.IDLE);
        return;
      }

      // Step 3: Send to backend and create the campaign
      setCurrentStep(CreationStep.CREATING_CAMPAIGN);
      const response = await fetch(API_ENDPOINTS.VERIFY_CAMPAIGN, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message,
          signature,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to verify campaign");
      }

      // If successful, navigate to the campaigns page and show a success message
      navigate("/campaigns");
      showSuccess("Campaign created successfully");
    } catch (error) {
      console.error("Error creating campaign:", getErrorMessage(error));
      showError(`Error creating campaign: ${getErrorMessage(error)}`);
    } finally {
      setIsSubmitting(false);
      setCurrentStep(CreationStep.IDLE);
    }
  };

  // Function to get the appropriate button text based on the current step
  const getButtonText = () => {
    if (!isSubmitting) return "Create Campaign";

    switch (currentStep) {
      case CreationStep.CREATING_TOPIC:
        return "Creating Topic...";
      case CreationStep.SIGNING_DATA:
        return "Signing Data...";
      case CreationStep.CREATING_CAMPAIGN:
        return "Creating Campaign...";
      default:
        return "Processing...";
    }
  };

  return (
    <div className="max-w-xl mx-auto">
      <h1 className="text-2xl font-bold text-primary-600 mb-6">
        Create New Campaign
      </h1>

      {!isPaired && (
        <div className="mb-6 p-4 bg-warning-50 border border-warning-200 rounded-md text-warning-700">
          Please connect your wallet first to create a campaign.
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label
            htmlFor="name"
            className="block text-sm font-medium text-secondary-700 mb-1"
          >
            Campaign Name
          </label>
          <input
            type="text"
            id="name"
            name="name"
            value={formData.name}
            onChange={handleChange}
            required
            maxLength={MAX_CAMPAIGN_NAME_LENGTH}
            className="w-full px-4 py-2 border border-secondary-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            placeholder="Enter campaign name"
          />
          <p className="mt-1 text-xs text-secondary-500 flex justify-end">
            {formData.name.length}/{MAX_CAMPAIGN_NAME_LENGTH}
          </p>
        </div>

        <div>
          <label
            htmlFor="prizePool"
            className="block text-sm font-medium text-secondary-700 mb-1"
          >
            Prize Pool (USD)
          </label>
          <input
            type="number"
            id="prizePool"
            name="prizePool"
            min="0"
            step="0.01"
            value={formData.prizePool || ""}
            onChange={handleChange}
            required
            className="w-full px-4 py-2 border border-secondary-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            placeholder="Enter prize amount in USD"
          />
        </div>

        <div>
          <div className="flex justify-between items-center mb-1">
            <label
              htmlFor="startDate"
              className="block text-sm font-medium text-secondary-700"
            >
              Campaign Start Date and Time
            </label>
            <div className="flex items-center">
              <input
                type="checkbox"
                id="useCurrentTime"
                checked={useCurrentTimeAsStart}
                onChange={handleUseCurrentTime}
                className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-secondary-300 rounded"
              />
              <label
                htmlFor="useCurrentTime"
                className="ml-2 block text-xs text-secondary-700"
              >
                Use current time
              </label>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label htmlFor="startDateInput" className="sr-only">
                Start Date
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg
                    className="h-5 w-5 text-secondary-400"
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path
                      fillRule="evenodd"
                      d="M6 2C5.44772 2 5 2.44772 5 3V4H4C2.89543 4 2 4.89543 2 6V16C2 17.1046 2.89543 18 4 18H16C17.1046 18 18 17.1046 18 16V6C18 4.89543 17.1046 4 16 4H15V3C15 2.44772 14.5523 2 14 2C13.4477 2 13 2.44772 13 3V4H7V3C7 2.44772 6.55228 2 6 2ZM16 6V16H4V6H16Z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
                <input
                  type="date"
                  id="startDateInput"
                  value={formatDateForDateInput(formData.startDate)}
                  onChange={(e) =>
                    handleDateChange("startDate", e.target.value)
                  }
                  required={!useCurrentTimeAsStart}
                  min={getMinStartDate()}
                  disabled={useCurrentTimeAsStart}
                  className="pl-10 w-full px-4 py-2 border border-secondary-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent disabled:bg-secondary-100 disabled:text-secondary-500"
                />
              </div>
            </div>
            <div>
              <label htmlFor="startTimeInput" className="sr-only">
                Start Time
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg
                    className="h-5 w-5 text-secondary-400"
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 18C14.4183 18 18 14.4183 18 10C18 5.58172 14.4183 2 10 2C5.58172 2 2 5.58172 2 10C2 14.4183 5.58172 18 10 18ZM11 6C11 5.44772 10.5523 5 10 5C9.44772 5 9 5.44772 9 6V10C9 10.2652 9.10536 10.5196 9.29289 10.7071L12.1213 13.5355C12.5118 13.9261 13.145 13.9261 13.5355 13.5355C13.9261 13.145 13.9261 12.5118 13.5355 12.1213L11 9.58579V6Z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
                <input
                  type="time"
                  id="startTimeInput"
                  value={formatDateForTimeInput(formData.startDate)}
                  onChange={(e) =>
                    handleTimeChange("startTime", e.target.value)
                  }
                  required={!useCurrentTimeAsStart}
                  disabled={useCurrentTimeAsStart}
                  className="pl-10 w-full px-4 py-2 border border-secondary-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent disabled:bg-secondary-100 disabled:text-secondary-500"
                />
              </div>
            </div>
          </div>
        </div>

        <div>
          <label
            htmlFor="endDate"
            className="block text-sm font-medium text-secondary-700 mb-1"
          >
            Campaign End Date and Time
          </label>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label htmlFor="endDateInput" className="sr-only">
                End Date
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg
                    className="h-5 w-5 text-secondary-400"
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path
                      fillRule="evenodd"
                      d="M6 2C5.44772 2 5 2.44772 5 3V4H4C2.89543 4 2 4.89543 2 6V16C2 17.1046 2.89543 18 4 18H16C17.1046 18 18 17.1046 18 16V6C18 4.89543 17.1046 4 16 4H15V3C15 2.44772 14.5523 2 14 2C13.4477 2 13 2.44772 13 3V4H7V3C7 2.44772 6.55228 2 6 2ZM16 6V16H4V6H16Z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
                <input
                  type="date"
                  id="endDateInput"
                  value={formatDateForDateInput(formData.endDate)}
                  onChange={(e) => handleDateChange("endDate", e.target.value)}
                  required
                  min={getMinEndDate(formData.startDate)}
                  className="pl-10 w-full px-4 py-2 border border-secondary-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
              </div>
            </div>
            <div>
              <label htmlFor="endTimeInput" className="sr-only">
                End Time
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg
                    className="h-5 w-5 text-secondary-400"
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 18C14.4183 18 18 14.4183 18 10C18 5.58172 14.4183 2 10 2C5.58172 2 2 5.58172 2 10C2 14.4183 5.58172 18 10 18ZM11 6C11 5.44772 10.5523 5 10 5C9.44772 5 9 5.44772 9 6V10C9 10.2652 9.10536 10.5196 9.29289 10.7071L12.1213 13.5355C12.5118 13.9261 13.145 13.9261 13.5355 13.5355C13.9261 13.145 13.9261 12.5118 13.5355 12.1213L11 9.58579V6Z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
                <input
                  type="time"
                  id="endTimeInput"
                  value={formatDateForTimeInput(formData.endDate)}
                  onChange={(e) => handleTimeChange("endTime", e.target.value)}
                  required
                  min={
                    getMinEndTime(
                      formData.startDate,
                      formData.endDate,
                      START_TO_END_TIME_DIFF_MINUTES
                    ) || undefined
                  }
                  className="pl-10 w-full px-4 py-2 border border-secondary-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
              </div>
            </div>
          </div>
          <p className="mt-1 text-xs text-secondary-500">
            End date must be after the start date
          </p>
        </div>

        <div>
          <label
            htmlFor="requirement"
            className="block text-sm font-medium text-secondary-700 mb-1"
          >
            Requirement Text
          </label>
          <textarea
            id="requirement"
            name="requirement"
            value={formData.requirement}
            onChange={handleChange}
            required
            maxLength={MAX_REQUIREMENT_LENGTH}
            rows={4}
            className="w-full px-4 py-2 border border-secondary-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            placeholder="Enter text that promoters need to include in their post"
            style={{ whiteSpace: "pre-wrap", overflowWrap: "break-word" }}
          />
          <p className="mt-1 text-xs text-secondary-500 flex justify-end">
            {formData.requirement.length}/{MAX_REQUIREMENT_LENGTH}
          </p>
        </div>

        <button
          type="submit"
          disabled={
            isSubmitting ||
            !isPaired ||
            (!formData.startDate && !useCurrentTimeAsStart) ||
            !formData.endDate
          }
          className="w-full px-6 py-3 bg-primary-600 text-white font-medium rounded-md hover:bg-primary-700 transition-colors disabled:bg-secondary-400 disabled:cursor-not-allowed"
        >
          {getButtonText()}
        </button>
      </form>
    </div>
  );
}
