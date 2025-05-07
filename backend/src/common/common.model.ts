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

  @prop({ required: true, unique: true })
  public publicKey!: string;
}

export const UserModel = getModelForClass(User);
export default UserModel;
