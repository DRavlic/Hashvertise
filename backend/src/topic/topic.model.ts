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

// Create and export the model
const TopicListenerModel = getModelForClass(TopicListener);
export default TopicListenerModel;
