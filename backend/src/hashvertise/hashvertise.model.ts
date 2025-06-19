import {
  prop,
  getModelForClass,
  modelOptions,
  Severity,
  index,
} from "@typegoose/typegoose";
import {
  HASHVERTISE_MIN_FEE_BASIS_POINTS,
  HASHVERTISE_MAX_FEE_BASIS_POINTS,
  HASHVERTISE_MIN_DEPOSIT_TINYBARS,
} from "../environment";

@modelOptions({
  schemaOptions: {
    timestamps: true,
    collection: "hashvertiseConfig",
  },
  options: {
    allowMixed: Severity.ALLOW,
  },
})
@index({}, { unique: true }) // Ensures only one config document can exist
export class Hashvertise {
  @prop({
    required: true,
    min: HASHVERTISE_MIN_FEE_BASIS_POINTS,
    max: HASHVERTISE_MAX_FEE_BASIS_POINTS,
  })
  public feeBasisPoints!: number;

  @prop({
    required: true,
    min: HASHVERTISE_MIN_DEPOSIT_TINYBARS,
  })
  public minimumDepositInTinybars!: number;

  @prop({ required: true, trim: true })
  public contractAddress!: string;
}

export const HashvertiseModel = getModelForClass(Hashvertise);
