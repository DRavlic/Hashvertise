import {
  prop,
  getModelForClass,
  modelOptions,
  Severity,
} from "@typegoose/typegoose";

@modelOptions({
  schemaOptions: {
    timestamps: true,
    collection: "usersX",
  },
  options: {
    allowMixed: Severity.ALLOW,
  },
})
export class UserX {
  @prop({ required: true, unique: true })
  public xId!: string;

  @prop({ default: true, unique: true })
  public userName!: string;

  @prop({ default: true })
  public createdOnXUtc!: Date;
}

export const UserXModel = getModelForClass(UserX);
export default UserXModel;
