export interface UserInfo {
  name: string;
  birthYear: number;
  location: string;
}

export interface LifeEvent {
  id: string;
  year: number;
  title: string;
  description: string;
  emotion: EmotionType;
}

export interface LifeGraphRequest {
  userInfo: UserInfo;
  events: LifeEvent[];
}

export interface LifeGraphResponse {
  userInfo: UserInfo;
  events: LifeEvent[];
}

export type EmotionType = 'VERY_HAPPY' | 'HAPPY' | 'NEUTRAL' | 'SAD' | 'VERY_SAD';

export type PrismaEmotion = 'joy' | 'sadness' | 'anger' | 'fear' | 'surprise' | 'neutral';