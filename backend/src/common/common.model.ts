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
  public username!: string;

  @prop({ required: true, unique: true })
  public email!: string;

  @prop({ required: true, unique: true })
  public publicKey!: string;

  @prop({ required: true })
  public hashedPassword!: string;
}

export const UserModel = getModelForClass(User);
export default UserModel;
