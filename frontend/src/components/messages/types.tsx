export type ChatUser = {
  userEmail: string;
  displayName: string;
  firebaseUid: string;
};

export type UserMessage = {
  content: string;
  sender: boolean;
  authorUid: string;
  conversationId: string;
  createdAt: string;
  updatedAt: string;
};
export type Conversation = {
  _id: string;
  participantsPopulated: ChatUser[];
  lastMessage: UserMessage;
  createdAt: string;
  updatedAt: string;
};
