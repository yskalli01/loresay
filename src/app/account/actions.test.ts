import { beforeEach, describe, expect, it, vi } from "vitest";

const profile = {
  avatarStoragePath: "user-1/profile.png",
  avatarUpdatedAt: new Date("2026-09-10T09:00:00.000Z"),
  createdAt: new Date("2026-09-10T09:00:00.000Z"),
  displayName: "Person Example",
  id: "user-1",
  updatedAt: new Date("2026-09-10T09:00:00.000Z"),
};

const deleteUser = vi.fn(async () => ({ error: null }));
const getProfile = vi.fn(async () => profile);
const updateProfile = vi.fn(async () => profile);
const updateProfileAvatar = vi.fn(async () => profile);
const deleteProfile = vi.fn(async () => undefined);
const removeAvatar = vi.fn(async () => undefined);
const uploadAvatar = vi.fn(async () => "user-1/profile.webp");
const updateUser = vi.fn(async () => ({ error: null }));

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  redirect: vi.fn((path: string) => {
    throw new Error(`redirect:${path}`);
  }),
}));

vi.mock("@/infrastructure/auth/session", () => ({
  requireSessionUser: vi.fn(async () => ({
    email: "person@example.com",
    id: "user-1",
  })),
}));

vi.mock("@/infrastructure/db/knowledge-repository", () => ({
  knowledgeRepository: {
    deleteProfile,
    getProfile,
    updateProfile,
    updateProfileAvatar,
  },
}));

vi.mock("@/infrastructure/supabase/account-storage", () => ({
  removeAvatar,
  uploadAvatar,
}));

vi.mock("@/infrastructure/supabase/admin", () => ({
  createSupabaseAdminClient: vi.fn(() => ({
    auth: { admin: { deleteUser } },
  })),
}));

vi.mock("@/infrastructure/supabase/server", () => ({
  createSupabaseServerClient: vi.fn(async () => ({
    auth: { updateUser },
  })),
}));

describe("account actions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getProfile.mockResolvedValue(profile);
    updateUser.mockResolvedValue({ error: null });
    deleteUser.mockResolvedValue({ error: null });
    uploadAvatar.mockResolvedValue("user-1/profile.webp");
  });

  it("updates the profile using the session owner", async () => {
    const { updateProfileAction } = await import("./actions");
    const formData = new FormData();
    formData.set("displayName", "New Name");

    await expect(updateProfileAction({}, formData)).resolves.toEqual({
      message: "Profile updated.",
    });
    expect(updateProfile).toHaveBeenCalledWith({
      displayName: "New Name",
      owner: { userId: "user-1" },
    });
  });

  it("rejects missing avatar uploads before touching storage", async () => {
    const { uploadProfileImageAction } = await import("./actions");
    const formData = new FormData();

    await expect(uploadProfileImageAction({}, formData)).resolves.toEqual({
      error: "Choose a profile image first.",
    });
    expect(uploadAvatar).not.toHaveBeenCalled();
  });

  it("uploads avatars with the session owner and stores the returned path", async () => {
    const { uploadProfileImageAction } = await import("./actions");
    const formData = new FormData();
    formData.set(
      "avatar",
      new File(["avatar"], "avatar.webp", { type: "image/webp" }),
    );

    await expect(uploadProfileImageAction({}, formData)).resolves.toEqual({
      message: "Profile photo updated.",
    });
    expect(uploadAvatar).toHaveBeenCalledWith({
      file: expect.any(File),
      owner: { userId: "user-1" },
      previousPath: "user-1/profile.png",
    });
    expect(updateProfileAvatar).toHaveBeenCalledWith({
      avatarStoragePath: "user-1/profile.webp",
      avatarUpdatedAt: expect.any(Date),
      owner: { userId: "user-1" },
    });
  });

  it("updates email and password through Supabase Auth", async () => {
    const { updateEmailAction, updatePasswordAction } =
      await import("./actions");
    const emailForm = new FormData();
    emailForm.set("email", "new@example.com");
    const passwordForm = new FormData();
    passwordForm.set("password", "new-secret");

    await expect(updateEmailAction({}, emailForm)).resolves.toEqual({
      message: "Email update requested.",
    });
    await expect(updatePasswordAction({}, passwordForm)).resolves.toEqual({
      message: "Password updated.",
    });
    expect(updateUser).toHaveBeenCalledWith({ email: "new@example.com" });
    expect(updateUser).toHaveBeenCalledWith({ password: "new-secret" });
  });

  it("deletes account data using the session owner only", async () => {
    const { deleteAccountAction } = await import("./actions");
    const formData = new FormData();
    formData.set("confirmation", "DELETE");
    formData.set("userId", "attacker");

    await expect(deleteAccountAction({}, formData)).rejects.toThrow(
      "redirect:/auth",
    );
    expect(removeAvatar).toHaveBeenCalledWith("user-1/profile.png");
    expect(deleteProfile).toHaveBeenCalledWith({ owner: { userId: "user-1" } });
    expect(deleteUser).toHaveBeenCalledWith("user-1");
  });
});
