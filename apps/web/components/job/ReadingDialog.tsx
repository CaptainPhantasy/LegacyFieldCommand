import React, { useState } from 'react';
import { X } from 'lucide-react';
import * as Dialog from '@radix-ui/react-dialog';
import { cn } from '@/lib/utils';

export interface ReadingData {
  id: string;
  room: string;
  location: string;
  material: string;
  value: string;
  goal: string;
}

interface ReadingDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: ReadingData) => void;
}

const MATERIALS = ['Drywall', 'Carpet', 'Hardwood', 'Tile', 'Concrete', 'Insulation'];
const ROOMS = ['Kitchen', 'Living Room', 'Master Bedroom', 'Basement', 'Hallway'];

export default function ReadingDialog({ open, onOpenChange, onSubmit }: ReadingDialogProps) {
  const [room, setRoom] = useState(ROOMS[0]);
  const [location, setLocation] = useState('');
  const [material, setMaterial] = useState(MATERIALS[0]);
  const [value, setValue] = useState('');
  const [goal, setGoal] = useState('12'); // Default goal for Drywall

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      id: crypto.randomUUID(),
      room,
      location,
      material,
      value,
      goal
    });
    onOpenChange(false);
    // Reset form
    setLocation('');
    setValue('');
  };

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 animate-in fade-in duration-200" />
        <Dialog.Content className="fixed left-[50%] top-[50%] max-h-[85vh] w-[90vw] max-w-[425px] translate-x-[-50%] translate-y-[-50%] rounded-card bg-elevated p-6 shadow-soft focus:outline-none z-50 border border-border-subtle animate-in zoom-in-95 duration-200">
          <div className="flex items-center justify-between mb-5">
            <Dialog.Title className="text-lg font-semibold text-main">
              Add Moisture Reading
            </Dialog.Title>
            <Dialog.Close className="text-muted hover:text-main transition-colors">
              <X size={20} />
            </Dialog.Close>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Room Selection */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-muted">Room / Area</label>
              <select 
                value={room}
                onChange={(e) => setRoom(e.target.value)}
                className="w-full h-11 bg-subtle border border-border-strong rounded-lg px-3 text-main focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent"
              >
                {ROOMS.map(r => <option key={r} value={r}>{r}</option>)}
              </select>
            </div>

            {/* Location Detail */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-muted">Specific Location</label>
              <input 
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="e.g. North Wall, Under Sink"
                className="w-full h-11 bg-subtle border border-border-strong rounded-lg px-3 text-main placeholder:text-soft focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent"
                required
              />
            </div>

            {/* Material Chips */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-muted">Material</label>
              <div className="flex flex-wrap gap-2">
                {MATERIALS.map(m => (
                  <button
                    type="button"
                    key={m}
                    onClick={() => {
                      setMaterial(m);
                      // Simple smart default logic
                      if (m === 'Drywall') setGoal('12');
                      if (m === 'Hardwood') setGoal('8');
                      if (m === 'Carpet') setGoal('Dry');
                    }}
                    className={cn(
                      "px-3 py-1.5 rounded-full text-xs font-medium border transition-all",
                      material === m 
                        ? "bg-accent text-white border-accent" 
                        : "bg-subtle text-muted border-border-subtle hover:border-main"
                    )}
                  >
                    {m}
                  </button>
                ))}
              </div>
            </div>

            {/* Value & Goal Row */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-muted">Reading</label>
                <input 
                  type="text" // Text to allow "OL" or specific codes if needed, otherwise number
                  inputMode="decimal"
                  value={value}
                  onChange={(e) => setValue(e.target.value)}
                  placeholder="0.0"
                  className="w-full h-11 bg-subtle border border-border-strong rounded-lg px-3 text-main placeholder:text-soft focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent text-lg font-semibold"
                  required
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-muted">Dry Goal</label>
                <input 
                  type="text"
                  value={goal}
                  onChange={(e) => setGoal(e.target.value)}
                  className="w-full h-11 bg-subtle border border-border-strong rounded-lg px-3 text-main focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent"
                />
              </div>
            </div>

            {/* Submit Button */}
            <button 
              type="submit"
              className="w-full bg-accent text-white font-medium h-11 rounded-lg hover:bg-blue-600 transition-colors active:scale-[0.98]"
            >
              Save Reading
            </button>
          </form>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

