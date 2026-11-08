/**
 * VBNB social accounts shown in the landing footer.
 * Empty values render the icon without a link. Email expects `mailto:...`.
 */
export const socialLinks = {
  facebook: '',
  email: '',
} as const;

export type SocialNetwork = keyof typeof socialLinks;
