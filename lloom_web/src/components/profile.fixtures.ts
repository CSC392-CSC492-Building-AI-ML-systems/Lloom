export type ProfilePresentation =
    | { status: "logged-out" }
    | { status: "logged-in"; name: string; email: string; initials: string };

// Presentation fixtures only: no authentication, credentials, or session persistence.
export const profileFixtures = {
    loggedOut: { status: "logged-out" },
    loggedIn: { status: "logged-in", name: "John Doe", email: "johndoe@mail.com", initials: "JD" },
} satisfies Record<string, ProfilePresentation>;

// Comment out whichever one you want to see.
// export const defaultProfile: ProfilePresentation = profileFixtures.loggedOut;
export const defaultProfile: ProfilePresentation = profileFixtures.loggedIn;
