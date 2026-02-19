
import { AppUser } from '../types';

// MOCK DATABASE (Simulating SharePoint List "AppUsers")
let mockAppUsers: AppUser[] = [
    {
        id: '1',
        Title: 'Alice Admin',
        MicrosoftEmail: 'alice.admin@tracker.app', // Must match valid Microsoft accounts for testing
        Role: 'SuperAdmin',
        Status: 'active',
        MustChangePassword: false,
        CreatedDate: new Date().toISOString(),
        CreatedBy: 'System',
        LastLoginDate: new Date().toISOString()
    },
    {
        id: '2',
        Title: 'Bob Manager',
        MicrosoftEmail: 'bob.manager@tracker.app',
        Role: 'Manager',
        Status: 'active',
        MustChangePassword: false,
        CreatedDate: new Date().toISOString(),
        CreatedBy: 'System'
    },
    {
        id: '3',
        Title: 'Charlie New',
        MicrosoftEmail: 'charlie.new@tracker.app',
        Role: 'User',
        Status: 'pending',
        TemporaryPassword: 'ChangeMe123!',
        MustChangePassword: true,
        CreatedDate: new Date().toISOString(),
        CreatedBy: 'Alice Admin'
    },
    {
        id: '4',
        Title: 'Dave Inactive',
        MicrosoftEmail: 'dave.inactive@tracker.app',
        Role: 'User',
        Status: 'inactive',
        MustChangePassword: false,
        CreatedDate: new Date().toISOString(),
        CreatedBy: 'Alice Admin'
    }
];

export interface AuthResult {
    success: boolean;
    user?: AppUser;
    error?: string;
    needsPasswordChange?: boolean;
}

// SIMULATED BACKEND DELAY
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export const authService = {
    /**
     * Step 2 Verification: Backend simulated logic
     * Checks if Microsoft Email exists in SharePoint and is Active
     */
    verifyUser: async (accessToken: string, email: string): Promise<AuthResult> => {
        await delay(800);
        console.log(`[Backend] Verifying user: ${email}`);

        const user = mockAppUsers.find(u => u.MicrosoftEmail.toLowerCase() === email.toLowerCase());

        if (!user) {
            return { success: false, error: 'User not found in authorized list.' };
        }

        if (user.Status === 'inactive') {
            return { success: false, error: 'Account is inactive. Contact administrator.' };
        }

        if (user.MustChangePassword) {
            return { success: true, user, needsPasswordChange: true };
        }

        // Update Last Login (Simulated)
        user.LastLoginDate = new Date().toISOString();

        return { success: true, user };
    },

    /**
     * Change Password Logic
     */
    changePassword: async (userId: string, tempPass: string, newPass: string): Promise<boolean> => {
        await delay(1000);
        const user = mockAppUsers.find(u => u.id === userId);

        if (!user) throw new Error("User not found");
        if (newPass.length < 8) throw new Error("New password too short");

        // Check temp pass
        if (user.TemporaryPassword !== tempPass) {
            throw new Error("Invalid temporary password");
        }

        // Update user "SharePoint" entry
        user.TemporaryPassword = null;
        user.MustChangePassword = false;
        user.Status = 'active'; // Activate user if they were pending

        return true;
    },

    // --- ADMIN METHODS ---

    getAllUsers: async (): Promise<AppUser[]> => {
        await delay(600);
        return [...mockAppUsers];
    },

    createUser: async (newUser: Partial<AppUser>): Promise<AppUser> => {
        await delay(1000);

        const existing = mockAppUsers.find(u => u.MicrosoftEmail === newUser.MicrosoftEmail);
        if (existing) throw new Error("User with this email already exists.");

        const generatedId = Math.random().toString(36).substr(2, 9);
        const tempPass = Math.random().toString(36).slice(-8) + "!";

        const user: AppUser = {
            id: generatedId,
            Title: newUser.Title || '',
            MicrosoftEmail: newUser.MicrosoftEmail || '',
            FirstName: newUser.FirstName,
            LastName: newUser.LastName,
            Role: newUser.Role || 'User',
            Status: 'pending',
            TemporaryPassword: tempPass,
            MustChangePassword: true,
            CreatedDate: new Date().toISOString(),
            CreatedBy: newUser.CreatedBy || 'Admin',
            InvitationSentDate: new Date().toISOString(), // Simulating Email Sent
            Notes: newUser.Notes
        };

        mockAppUsers = [user, ...mockAppUsers];

        // Log "Email Sent" to console
        console.log(`[Backend] 📧 EMAIL SENT to ${user.MicrosoftEmail}: Link=..., TempPass=${tempPass}`);

        return user;
    },

    updateUser: async (id: string, updates: Partial<AppUser>): Promise<AppUser> => {
        await delay(500);
        const index = mockAppUsers.findIndex(u => u.id === id);
        if (index === -1) throw new Error("User not found");

        mockAppUsers[index] = { ...mockAppUsers[index], ...updates };
        return mockAppUsers[index];
    },

    deleteUser: async (id: string): Promise<void> => {
        await delay(500);
        mockAppUsers = mockAppUsers.filter(u => u.id !== id);
    }
};

