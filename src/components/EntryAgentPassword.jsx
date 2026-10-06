import { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';

export default function EntryAgentPassword({ className, ...props }) {
  const [visible, setVisible] = useState(false);
  const Icon = visible ? EyeOff : Eye;
  return <span className="relative block">
    <input {...props} type={visible ? 'text' : 'password'} className={`${className} !pr-12`} />
    <button type="button" aria-label={visible ? 'Hide password' : 'Show password'} aria-pressed={visible}
      className="absolute bottom-0 right-0 flex h-full min-h-[36px] w-[44px] items-center justify-center rounded-lg text-muted-foreground hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      onClick={() => setVisible(value => !value)}><Icon size={16} aria-hidden="true" /></button>
  </span>;
}
