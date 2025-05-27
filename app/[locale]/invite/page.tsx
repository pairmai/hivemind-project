"use client";

import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { getAuth, onAuthStateChanged, signOut } from "firebase/auth";
import { db } from "../../lib/firebase";
import { doc, getDoc, updateDoc, arrayUnion, arrayRemove } from "firebase/firestore";

export default function InvitePage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    console.log("✅ Invite page loaded");

    const auth = getAuth();
    const projectId = searchParams.get("projectId");
    const emailInLink = searchParams.get("email");

    if (!projectId || !emailInLink) {
      alert("Invalid invite link.");
      router.replace("/");
      return;
    }

    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        const userEmail = user.email;

        // Check if logged-in email matches invite email
        if (userEmail !== emailInLink) {
          alert(`Please login with ${emailInLink} to accept this invitation.`);
          await signOut(auth);
          // Redirect to login with invite email pre-filled
          router.replace(`/login?email=${emailInLink}&projectId=${projectId}`);
          return;
        }

        try {
          const projectRef = doc(db, "projects", projectId);
          const projectSnap = await getDoc(projectRef);

          if (!projectSnap.exists()) {
            alert("Project not found.");
            router.replace("/");
            return;
          }

          const projectData = projectSnap.data();
          const collaborators = projectData.collaborators || [];

          if (!collaborators.includes(userEmail)) {
            await updateDoc(projectRef, {
              collaborators: arrayUnion(userEmail),
              invitedEmails: arrayRemove(userEmail),
            });
            console.log("✅ User added to project");
          }

          // Redirect to project
          router.replace(`/task-organizer?projectId=${projectId}`);
        } catch (err) {
          console.error("🔥 Error joining project:", err);
          alert("Failed to join project. Please try again.");
        }
      } else {
        // Not logged in - save invite data and redirect to signup
        localStorage.setItem('inviteData', JSON.stringify({
          projectId,
          email: emailInLink
        }));
        router.replace(`/signup?email=${emailInLink}&projectId=${projectId}`);
      }
    });

    return () => unsubscribe();
  }, [router, searchParams]);

  return (
    <div className="flex justify-center items-center h-screen">
      <p className="text-lg">Processing invite...</p>
    </div>
  );
}