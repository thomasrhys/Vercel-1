import AdminUtilitiesCard from "../AdminUtilitiesCard";
import PasswordResetCard from "../PasswordResetCard";
import VerificationEmailCard from "../VerificationEmailCard";

export default function AdminUtilitiesPage() {
  return (
    <>
      <AdminUtilitiesCard />
      <div className="bg-background p-4 sm:px-8 sm:pt-8 sm:pb-0">
        <div className="max-w-2xl mx-auto space-y-8">
          <PasswordResetCard />
          <VerificationEmailCard />
        </div>
      </div>
    </>
  );
}
