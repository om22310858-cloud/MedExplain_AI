import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext.js';
import { useTheme } from '../contexts/ThemeContext.js';
import { authService } from '../services/authService.js';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '../components/common/Card.js';
import { Button } from '../components/common/Button.js';
import { Input } from '../components/common/Input.js';
import { Select } from '../components/common/Select.js';
import { Alert } from '../components/common/Alert.js';
import { Modal } from '../components/common/Modal.js';
import {
  User,
  Shield,
  KeyRound,
  Trash2,
  CheckCircle2,
  Sun,
  Moon,
  Laptop,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const ProfilePage: React.FC = () => {
  const { user, updateUser, logout } = useAuth();
  const { theme, setTheme } = useTheme();
  const navigate = useNavigate();

  // Profile details state
  const [name, setName] = useState(user?.name || '');
  const [age, setAge] = useState<number | ''>(user?.profile?.age ?? '');
  const [gender, setGender] = useState<string>(user?.profile?.gender || 'prefer_not_to_say');
  const [bloodGroup, setBloodGroup] = useState(user?.profile?.bloodGroup || '');
  const [phone, setPhone] = useState(user?.profile?.phone || '');

  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);
  const [profileSuccess, setProfileSuccess] = useState(false);
  const [profileError, setProfileError] = useState<string | null>(null);

  // Change password state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [passwordSuccess, setPasswordSuccess] = useState(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);

  // Account deletion modal
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [isDeletingAccount, setIsDeletingAccount] = useState(false);

  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsUpdatingProfile(true);
    setProfileSuccess(false);
    setProfileError(null);

    try {
      const updatedUser = await authService.updateProfile({
        name: name.trim(),
        themePreference: theme,
        profile: {
          age: age !== '' ? Number(age) : null,
          gender: gender as any,
          bloodGroup: bloodGroup.trim() || null,
          phone: phone.trim() || null,
        },
      });
      updateUser(updatedUser);
      setProfileSuccess(true);
    } catch (err: any) {
      setProfileError(err.customMessage || 'Failed to update profile.');
    } finally {
      setIsUpdatingProfile(false);
    }
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError(null);
    setPasswordSuccess(false);

    if (newPassword !== confirmNewPassword) {
      setPasswordError('New passwords do not match.');
      return;
    }

    setIsChangingPassword(true);

    try {
      await authService.changePassword({
        currentPassword,
        newPassword,
        confirmNewPassword,
      });
      setPasswordSuccess(true);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmNewPassword('');
    } catch (err: any) {
      setPasswordError(err.customMessage || 'Failed to change password.');
    } finally {
      setIsChangingPassword(false);
    }
  };

  const handleDeleteAccount = async () => {
    setIsDeletingAccount(true);
    try {
      await authService.deleteAccount();
      await logout();
      navigate('/login');
    } catch (err) {
      console.error('Account deletion failed', err);
      setIsDeletingAccount(false);
    }
  };

  return (
    <div className="max-w-4xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">
          Profile & Account Settings
        </h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          Manage your personal information, security preferences, and stored health data.
        </p>
      </div>

      {/* Profile Information */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <User className="h-5 w-5 text-primary-600" />
            <CardTitle>Personal Information</CardTitle>
          </div>
          <CardDescription>
            Update your account name and optional health profile attributes
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleProfileSubmit}>
          <CardContent className="space-y-4">
            {profileSuccess && (
              <Alert variant="success" title="Success">
                Your profile information has been saved successfully.
              </Alert>
            )}
            {profileError && (
              <Alert variant="destructive" title="Error">
                {profileError}
              </Alert>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Full Name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />

              <Input
                label="Email Address"
                value={user?.email || ''}
                disabled
                helperText="Email cannot be changed directly."
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <Input
                label="Age (Years, Optional)"
                type="number"
                placeholder="e.g. 52"
                value={age}
                onChange={(e) => setAge(e.target.value ? Number(e.target.value) : '')}
                helperText="Used for clinical risk equations like eGFR"
              />

              <Select
                label="Biological Sex"
                value={gender}
                onChange={(e) => setGender(e.target.value)}
              >
                <option value="prefer_not_to_say">Prefer not to say</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="other">Other</option>
              </Select>

              <Input
                label="Blood Group (Optional)"
                placeholder="e.g. O+, B+"
                value={bloodGroup}
                onChange={(e) => setBloodGroup(e.target.value)}
              />
            </div>

            {/* Theme Preference */}
            <div className="space-y-2 pt-2 border-t border-border">
              <label className="block text-sm font-medium text-foreground">
                Display Theme Preference
              </label>
              <div className="flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={() => setTheme('light')}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg border text-sm font-medium transition-colors ${
                    theme === 'light'
                      ? 'border-primary bg-primary-50 text-primary-700 dark:bg-primary-950 font-semibold'
                      : 'border-border text-foreground hover:bg-muted'
                  }`}
                >
                  <Sun className="h-4 w-4" /> Light
                </button>
                <button
                  type="button"
                  onClick={() => setTheme('dark')}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg border text-sm font-medium transition-colors ${
                    theme === 'dark'
                      ? 'border-primary bg-primary-50 text-primary-700 dark:bg-primary-950 font-semibold'
                      : 'border-border text-foreground hover:bg-muted'
                  }`}
                >
                  <Moon className="h-4 w-4" /> Dark
                </button>
                <button
                  type="button"
                  onClick={() => setTheme('system')}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg border text-sm font-medium transition-colors ${
                    theme === 'system'
                      ? 'border-primary bg-primary-50 text-primary-700 dark:bg-primary-950 font-semibold'
                      : 'border-border text-foreground hover:bg-muted'
                  }`}
                >
                  <Laptop className="h-4 w-4" /> System Default
                </button>
              </div>
            </div>
          </CardContent>
          <CardFooter className="flex justify-end pt-2">
            <Button type="submit" variant="primary" isLoading={isUpdatingProfile}>
              Save Profile Changes
            </Button>
          </CardFooter>
        </form>
      </Card>

      {/* Change Password */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <KeyRound className="h-5 w-5 text-indigo-600" />
            <CardTitle>Account Security</CardTitle>
          </div>
          <CardDescription>Update your login password regularly</CardDescription>
        </CardHeader>
        <form onSubmit={handlePasswordSubmit}>
          <CardContent className="space-y-4">
            {passwordSuccess && (
              <Alert variant="success" title="Success">
                Password changed successfully.
              </Alert>
            )}
            {passwordError && (
              <Alert variant="destructive" title="Error">
                {passwordError}
              </Alert>
            )}

            <Input
              label="Current Password"
              type="password"
              placeholder="••••••••"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              required
            />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="New Password"
                type="password"
                placeholder="At least 8 characters"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
              />
              <Input
                label="Confirm New Password"
                type="password"
                placeholder="Re-enter new password"
                value={confirmNewPassword}
                onChange={(e) => setConfirmNewPassword(e.target.value)}
                required
              />
            </div>
          </CardContent>
          <CardFooter className="flex justify-end pt-2">
            <Button type="submit" variant="secondary" isLoading={isChangingPassword}>
              Update Password
            </Button>
          </CardFooter>
        </form>
      </Card>

      {/* Privacy and Data Rights */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-teal-600" />
            <CardTitle>Privacy & Medical Data Rights</CardTitle>
          </div>
          <CardDescription>Transparency on how your clinical documents are stored</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3 text-xs text-muted-foreground leading-relaxed">
          <p>
            • <strong className="text-foreground">Private File Storage:</strong> Your medical documents are stored in private local directories outside public web routes. Downloads are streamed only to verified sessions.
          </p>
          <p>
            • <strong className="text-foreground">Zero Third-Party Advertising:</strong> We never sell, rent, or trade your medical reports, biomarkers, or personal credentials.
          </p>
          <p>
            • <strong className="text-foreground">Right to Erasure:</strong> When you delete a report or your account, all associated database records, extracted measurements, and physical files are deleted immediately.
          </p>
        </CardContent>
      </Card>

      {/* Danger Zone: Account Deletion */}
      <Card className="border-destructive/40 bg-destructive/5">
        <CardHeader>
          <div className="flex items-center gap-2 text-destructive">
            <Trash2 className="h-5 w-5" />
            <CardTitle className="text-destructive">Danger Zone</CardTitle>
          </div>
          <CardDescription>
            Permanently delete your account and all associated medical data
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-xs text-muted-foreground leading-relaxed">
            Deleting your account will permanently remove your user profile, all uploaded reports,
            all extracted lab values, historical comparisons, and AI analyses.
          </p>
        </CardContent>
        <CardFooter className="flex justify-end pt-2">
          <Button
            variant="destructive"
            size="sm"
            onClick={() => setDeleteModalOpen(true)}
          >
            Delete Account Permanently
          </Button>
        </CardFooter>
      </Card>

      {/* Account Deletion Confirmation Modal */}
      <Modal
        isOpen={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        title="Confirm Account Deletion"
        description="This action is permanent and cannot be undone."
        maxWidth="sm"
      >
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Are you sure you want to delete your MedExplain_AI account? All medical reports, files,
            and health records will be destroyed immediately.
          </p>

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-border">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setDeleteModalOpen(false)}
              disabled={isDeletingAccount}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={handleDeleteAccount}
              isLoading={isDeletingAccount}
            >
              Yes, Delete Everything
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
