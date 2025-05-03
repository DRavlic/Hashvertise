import {
  prop,
  getModelForClass,
  modelOptions,
  Severity,
} from "@typegoose/typegoose";

@modelOptions({
  schemaOptions: {
    timestamps: true,
    collection: "topicListeners",
  },
  options: {
    allowMixed: Severity.ALLOW,
  },
})
export class TopicListener {
  @prop({ required: true, unique: true, index: true })
  public topicId!: string;

  @prop({ default: true })
  public isActive!: boolean;
}

@modelOptions({
  schemaOptions: {
    timestamps: true,
    collection: "topicMessages",
  },
  options: {
    allowMixed: Severity.ALLOW,
  },
})
export class TopicMessage {
  @prop({ required: true, index: true })
  public topicId!: string;

  @prop({ required: true })
  public message!: string;

  @prop()
  public consensusTimestamp?: Date;
}

@modelOptions({
  schemaOptions: {
    timestamps: true,
    collection: "campaigns",
  },
  options: {
    allowMixed: Severity.ALLOW,
  },
})
export class Campaign {
  @prop({ required: true, unique: true, index: true })
  public topicId!: string;

  @prop({ required: true })
  public name!: string;

  @prop({ required: true, index: true })
  public accountId!: string;

  @prop({ required: true })
  public prizePool!: number;

  @prop({ required: true })
  public requirement!: string;

  @prop({ required: true, unique: true })
  public txId!: string;
}

// Create and export the models
export const TopicListenerModel = getModelForClass(TopicListener);
export const TopicMessageModel = getModelForClass(TopicMessage);
export const CampaignModel = getModelForClass(Campaign);
export default TopicListenerModel;
