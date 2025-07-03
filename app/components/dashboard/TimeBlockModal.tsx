// app/components/dashboard/TimeBlockModal.tsx
'use client';

import { DateTimePicker } from '@/components/common/DateTimePicker';
import { useNotificationStore } from '@/store/useNotificationStore';
import { TimeBlock } from '@/types';
import { timeBlockFormSchema } from '@/utils/schemas';
import { zodResolver } from '@hookform/resolvers/zod';
import { format, parse } from 'date-fns';
import React, { useEffect, useState } from 'react';
import { SubmitHandler, useForm } from 'react-hook-form';
import { FiCheck, FiLoader, FiX } from 'react-icons/fi';
import { z } from 'zod';

type TimeBlockFormData = z.infer<typeof timeBlockFormSchema>;

interface TimeBlockModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (
    data: { label: string; startTime: string; endTime: string; color: string },
    id: string | null
  ) => Promise<void>;
  blockToEdit: TimeBlock | null;
}

const colorPalette = ['#38bdf8', '#84cc16', '#f97316', '#ec4899', '#a855f7'];

const TimeBlockModal: React.FC<TimeBlockModalProps> = ({
  isOpen,
  onClose,
  onSave,
  blockToEdit,
}) => {
  const showToast = useNotificationStore(state => state.showToast);
  const [isStartPickerOpen, setIsStartPickerOpen] = useState(false);
  const [isEndPickerOpen, setIsEndPickerOpen] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors, isSubmitting, isDirty, isValid },
  } = useForm<TimeBlockFormData>({
    resolver: zodResolver(timeBlockFormSchema),
    mode: 'onTouched',
  });

  const watchedColor = watch('color');
  const watchedStartTime = watch('startTime');
  const watchedEndTime = watch('endTime');

  useEffect(() => {
    if (isOpen) {
      if (blockToEdit) {
        reset({
          label: blockToEdit.label,
          startTime: parse(blockToEdit.startTime, 'HH:mm', new Date()),
          endTime: parse(blockToEdit.endTime, 'HH:mm', new Date()),
          color: blockToEdit.color,
        });
      } else {
        reset({
          label: '',
          startTime: new Date(),
          endTime: new Date(),
          color: colorPalette[0],
        });
      }
    }
  }, [isOpen, blockToEdit, reset]);

  useEffect(() => {
    Object.values(errors).forEach(error => {
      if (error.message) {
        showToast(error.message, 'error');
      }
    });
  }, [errors, showToast]);

  const onSubmit: SubmitHandler<TimeBlockFormData> = async data => {
    await onSave(
      {
        label: data.label,
        startTime: format(data.startTime, 'HH:mm'),
        endTime: format(data.endTime, 'HH:mm'),
        color: data.color,
      },
      blockToEdit?.id || null
    );
    onClose();
  };

  if (!isOpen) return null;

  return (
    <>
      <div
        className="flex fixed inset-0 z-50 justify-center items-center p-4 backdrop-blur-sm bg-black/60"
        onClick={onClose}
      >
        <div
          className="w-full max-w-md rounded-3xl border shadow-2xl backdrop-blur-md bg-bg-secondary border-border-primary"
          onClick={e => e.stopPropagation()}
        >
          <form onSubmit={handleSubmit(onSubmit)}>
            <div className="flex justify-between items-center p-6 border-b border-border-primary">
              <h2 className="text-xl font-semibold text-text-primary">
                {blockToEdit ? 'Edit' : 'Create'} Time Block
              </h2>
              <button
                type="button"
                className="p-1.5 rounded-full text-text-tertiary hover:text-text-primary hover:bg-bg-tertiary cursor-pointer"
                onClick={onClose}
                aria-label="Close modal"
              >
                <FiX />
              </button>
            </div>
            <div className="p-6 space-y-6">
              <div>
                <label className="block mb-2 text-sm text-text-secondary">Label</label>
                <input
                  type="text"
                  placeholder="e.g., Deep Work"
                  {...register('label')}
                  className="p-3 w-full rounded-lg border text-text-primary bg-bg-primary border-border-primary focus:ring-2 focus:ring-border-accent focus:outline-none"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block mb-2 text-sm text-text-secondary">Start Time</label>
                  <button
                    type="button"
                    onClick={() => setIsStartPickerOpen(true)}
                    className="p-3 w-full text-left rounded-lg border cursor-pointer text-text-primary bg-bg-primary border-border-primary focus:ring-2 focus:ring-border-accent focus:outline-none"
                  >
                    {watchedStartTime ? format(watchedStartTime, 'h:mm a') : 'Select'}
                  </button>
                </div>
                <div>
                  <label className="block mb-2 text-sm text-text-secondary">End Time</label>
                  <button
                    type="button"
                    onClick={() => setIsEndPickerOpen(true)}
                    className="p-3 w-full text-left rounded-lg border cursor-pointer text-text-primary bg-bg-primary border-border-primary focus:ring-2 focus:ring-border-accent focus:outline-none"
                  >
                    {watchedEndTime ? format(watchedEndTime, 'h:mm a') : 'Select'}
                  </button>
                </div>
              </div>
              <div>
                <label className="block mb-2 text-sm text-text-secondary">Color</label>
                <div className="flex gap-2">
                  {colorPalette.map(color => (
                    <button
                      key={color}
                      type="button"
                      onClick={() =>
                        setValue('color', color, { shouldDirty: true, shouldValidate: true })
                      }
                      style={{ backgroundColor: color }}
                      className={`w-8 h-8 rounded-full border-2 transition-transform hover:scale-110 cursor-pointer ${
                        watchedColor === color ? 'border-white' : 'border-transparent'
                      }`}
                    />
                  ))}
                </div>
              </div>
            </div>
            <div className="p-6 border-t border-border-primary">
              <button
                type="submit"
                disabled={isSubmitting || !isDirty || !isValid}
                className="inline-flex gap-2 justify-center items-center px-6 py-3 w-full text-lg font-semibold text-black bg-white rounded-full transition-all duration-200 cursor-pointer hover:bg-gray-200 disabled:opacity-60"
              >
                {isSubmitting ? <FiLoader className="w-5 h-5 animate-spin" /> : <FiCheck />}{' '}
                {isSubmitting ? 'Saving...' : blockToEdit ? 'Save Changes' : 'Add Block'}
              </button>
            </div>
          </form>
        </div>
      </div>
      <DateTimePicker
        isOpen={isStartPickerOpen}
        onClose={() => setIsStartPickerOpen(false)}
        onChange={date => {
          if (date) {
            setValue('startTime', date, { shouldDirty: true, shouldValidate: true });
          }
        }}
        value={watchedStartTime}
        mode="time"
      />
      <DateTimePicker
        isOpen={isEndPickerOpen}
        onClose={() => setIsEndPickerOpen(false)}
        onChange={date => {
          if (date) {
            setValue('endTime', date, { shouldDirty: true, shouldValidate: true });
          }
        }}
        value={watchedEndTime}
        mode="time"
      />
    </>
  );
};

export default TimeBlockModal;
