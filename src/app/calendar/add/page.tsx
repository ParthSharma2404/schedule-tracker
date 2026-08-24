import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/authOptions";
import { prisma } from "@/lib/prisma";
import AddEventForm from "./AddEventForm";
import { redirect } from "next/navigation";

export default async function AddEventPage({
  searchParams,
}: {
  searchParams: { [key: string]: string | string[] | undefined };
}) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    redirect("/");
  }

  const emailId = searchParams.emailId as string | undefined;
  let email = null;

  if (emailId) {
    email = await prisma.email.findUnique({
      where: { id: emailId, userId: session.user.id }
    });
  }

  return (
    <div style={{ maxWidth: '600px', margin: '0 auto', padding: '2rem 1rem' }}>
      <h1 style={{ fontSize: '1.75rem', fontWeight: 600, margin: '0 0 0.5rem 0' }}>Add Event Manually</h1>
      {email && (
        <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginBottom: '2rem' }}>
          Based on email: <strong>{email.subject}</strong> from {email.sender}
        </p>
      )}
      
      <AddEventForm email={email} />
    </div>
  );
}
