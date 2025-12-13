import { api } from "./api";

export const loginWithCredentials = async (email: string, password: string) => {
    return api("/api/mobile-login", {
        method: "POST",
        body: JSON.stringify({ email, password }),
    });
};
