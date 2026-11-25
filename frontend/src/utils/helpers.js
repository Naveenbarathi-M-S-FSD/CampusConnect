export const ROLES = [
  { value: 'student', label: 'Student', color: '#4ade80' },
  { value: 'assistant_professor', label: 'Asst. Professor', color: '#60a5fa' },
  { value: 'professor', label: 'Professor', color: '#818cf8' },
  { value: 'hod', label: 'Head of Department', color: '#f472b6' },
  { value: 'principal', label: 'Principal', color: '#fb923c' },
  { value: 'office_staff', label: 'Office Staff', color: '#facc15' },
  { value: 'librarian', label: 'Librarian', color: '#34d399' },
  { value: 'ped_teacher', label: 'PED Teacher', color: '#a78bfa' },
  { value: 'club_member', label: 'Club Member', color: '#f87171' },
  { value: 'admin', label: 'Admin', color: '#e879f9' },
];

export const CATEGORIES = [
  { value: 'announcement', label: '📢 Announcement' },
  { value: 'event', label: '🎉 Event' },
  { value: 'notice', label: '📌 Notice' },
  { value: 'achievement', label: '🏆 Achievement' },
  { value: 'task', label: '📋 Task' },
  { value: 'general', label: '💬 General' },
];

export const getRoleInfo = (role) =>
  ROLES.find(r => r.value === role) || { label: role, color: '#94a3b8' };

export const getInitials = (name = '') =>
  name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);

export const timeAgo = (date) => {
  const diff = Date.now() - new Date(date).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(date).toLocaleDateString();
};

export const DEPARTMENTS = [
  'Computer Science', 'Information Technology', 'Electronics', 'Mechanical',
  'Civil', 'Electrical', 'Mathematics', 'Physics', 'Chemistry', 'English', 'Management'
];
