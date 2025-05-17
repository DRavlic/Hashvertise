import {
  prop,
  getModelForClass,
  modelOptions,
  Severity,
} from "@typegoose/typegoose";

@modelOptions({
  schemaOptions: {
    timestamps: true,
    collection: "users",
  },
  options: {
    allowMixed: Severity.ALLOW,
  },
})
export class User {
  @prop({ required: true, unique: true, index: true })
  public accountId!: string;

  // Needed for signature verification
  @prop({ required: true, unique: true })
  public publicKey!: string;

  // Needed for contract interaction
  @prop({ required: true, unique: true })
  public evmAddress!: string;
}

export const UserModel = getModelForClass(User);
export default UserModel;
