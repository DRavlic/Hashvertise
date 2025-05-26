export interface TwitterUserLastTweetsResponse {
  status: string;
  code: number;
  msg: string;
  data?: TwitterUserTweetsData;
}

export interface TwitterUserTweetsData {
  pin_tweet: any;
  tweets: Tweet[];
  has_next_page: boolean;
  next_cursor: string;
}

export interface Tweet {
  type: string;
  id: string;
  url: string;
  text: string;
  source: string;
  retweetCount: number;
  replyCount: number;
  likeCount: number;
  quoteCount: number;
  viewCount: number;
  createdAt: string;
  lang: string;
  bookmarkCount: number;
  isReply: boolean;
  inReplyToId?: string;
  conversationId?: string;
  inReplyToUserId?: string;
  inReplyToUsername?: string;
  author: Author;
  entities?: Entities;
  quoted_tweet?: any;
  retweeted_tweet?: any;
}

export interface Author {
  type: string;
  userName: string;
  url: string;
  id: string;
  name: string;
  isBlueVerified: boolean;
  profilePicture: string;
  // TO DO: see if you need to add more fields
}

export interface Entities {
  hashtags?: Hashtag[];
  urls?: Url[];
  user_mentions?: UserMention[];
}

export interface Hashtag {
  indices: number[];
  text: string;
}

export interface Url {
  display_url: string;
  expanded_url: string;
  indices: number[];
  url: string;
}

export interface UserMention {
  id_str: string;
  name: string;
  screen_name: string;
}

export interface DistributeRewardResponse {
  success: boolean;
  topicId: string;
  result: string;
  message?: string;
  error?: string;
}

export interface TwitterUserInfoResponse {
  status: string;
  msg: string;
  data: TwitterUserInfo | null;
}

export interface TwitterUserInfo {
  id: string;
  name: string;
  userName: string;
  location: string;
  url: string;
  description: string;
  protected: boolean;
  isVerified: boolean;
  isBlueVerified: boolean;
  verifiedType: string | null;
  followers: number;
  following: number;
  favouritesCount: number;
  statusesCount: number;
  mediaCount: number;
  createdAt: string;
  coverPicture: string;
  profilePicture: string;
  canDm: boolean;
  isAutomated: boolean;
  automatedBy: string | null;
}

export interface UserTweetsServiceResponse {
  success: boolean;
  tweets?: Tweet[];
  hasNextPage?: boolean;
  nextCursor?: string;
  error?: string;
}

export interface UserInfoServiceResponse {
  success: boolean;
  userInfo?: TwitterUserInfo;
  error?: string;
}
