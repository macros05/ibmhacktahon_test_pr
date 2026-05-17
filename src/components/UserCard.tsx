import React from 'react';

export interface UserCardProps {
  name: string;
  email: string;
  avatarUrl?: string;
}

export function UserCard({ name, email, avatarUrl }: UserCardProps) {
  return (
    <article className="user-card" aria-label={`User ${name}`}>
      {avatarUrl ? (
        <img src={avatarUrl} alt={`${name}'s avatar`} className="avatar" />
      ) : (
        <div className="avatar avatar--placeholder" aria-hidden="true" />
      )}
      <div>
        <h3>{name}</h3>
        <p>{email}</p>
      </div>
    </article>
  );
}
