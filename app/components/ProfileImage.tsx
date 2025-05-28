import React from "react";

interface ProfileImageProps {
  email?: string;
}

const ProfileImage: React.FC<ProfileImageProps> = ({ email = "" }) => {
  const getInitialsFromEmail = (email: string): string => {
    const localPart = email.split("@")[0];
    const parts = localPart.split(/[._]/);
    return parts.map(part => part[0]?.toUpperCase()).slice(0, 2).join('');
  };

  const colors = ['#2C87F2', '#DF34BA', '#D500F9', '#00E676', '#FFD600', '#DF34BA'];
  const emailHash = email.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  const color = colors[emailHash % colors.length];
  const initials = getInitialsFromEmail(email);

  return (
    <div
      style={{
        width: 40,
        height: 40,
        borderRadius: '50%',
        backgroundColor: color,
        color: '#fff',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontWeight: 'bold',
        fontSize: 14,
        boxShadow: '0 2px 6px rgba(0, 0, 0, 0.2)',
        cursor: 'pointer',
      }}
    >
      {initials || "?"}
    </div>
  );
};

export default ProfileImage;