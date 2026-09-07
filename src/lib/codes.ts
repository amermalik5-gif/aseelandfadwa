import { customAlphabet } from "nanoid";

// No ambiguous characters (0/O, 1/l/I) so codes survive being read aloud or retyped.
const alphabet = "23456789abcdefghjkmnpqrstuvwxyzABCDEFGHJKMNPQRSTUVWXYZ";

export const newInviteCode = customAlphabet(alphabet, 10);
