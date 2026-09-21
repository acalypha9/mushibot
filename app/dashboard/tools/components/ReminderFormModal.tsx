"use client";

import React from "react";
import Button from "@/components/ui/Button";
import Modal from "@/components/ui/Modal";
import type { CronReminderItem, ChannelOption } from "../types";
import { useReminderForm } from "./reminder_form/useReminderForm";
import { ReminderBasicFields, ReminderActiveToggle } from "./reminder_form/ReminderBasicFields";
import { VariablesDictionaryEditor } from "./reminder_form/VariablesDictionaryEditor";
import { RecipientSelector } from "./reminder_form/RecipientSelector";
import { BlacklistConfig } from "./reminder_form/BlacklistConfig";
import { ScheduleConfigSection } from "./reminder_form/ScheduleConfigSection";
import { MessageTemplateEditor } from "./reminder_form/MessageTemplateEditor";
import { Clock, Loader2 } from "lucide-react";

interface ReminderFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  editingReminder: CronReminderItem | null;
  availableChannels: ChannelOption[];
  token: string | null;
  onSaved: (savedTitle: string, isEdit: boolean) => void;
}

export default function ReminderFormModal(props: ReminderFormModalProps) {
  const { isOpen, onClose, editingReminder } = props;
  const form = useReminderForm(props);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={editingReminder ? "Edit Reminder" : "Add Reminder"}
      subtitle="Configure automated reminder schedule and target delivery channel."
      icon={<Clock style={{ width: "20px", height: "20px", color: "#742774" }} />}
      maxWidth="lg"
      footer={
        <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", width: "100%" }}>
          <Button
            type="button"
            variant="ghost"
            size="md"
            onClick={onClose}
            style={{ border: "1px solid #e1dfdd", color: "#323130" }}
          >
            Cancel
          </Button>

          <Button
            type="button"
            variant="primary"
            size="md"
            onClick={form.handleSaveReminder}
            disabled={form.savingReminder}
            style={{ display: "flex", alignItems: "center", gap: "6px" }}
          >
            {form.savingReminder ? (
              <>
                <Loader2 className="animate-spin" style={{ width: "14px", height: "14px" }} />
                <span>Saving...</span>
              </>
            ) : (
              <span>{editingReminder ? "Update Reminder" : "Save Reminder"}</span>
            )}
          </Button>
        </div>
      }
    >
      <form onSubmit={form.handleSaveReminder} style={{ display: "flex", flexDirection: "column", gap: "18px" }}>
        {/* Error Banner & 1. Reminder Title */}
        <ReminderBasicFields
          title={form.reminderTitleInput}
          setTitle={form.setReminderTitleInput}
          formError={form.reminderFormError}
        />

        {/* 2. Custom Dictionary Variables */}
        <VariablesDictionaryEditor
          variables={form.reminderVariables}
          setVariables={form.setReminderVariables}
        />

        {/* 3. Target Delivery Channel & Recipients */}
        <RecipientSelector
          reminderChannelTypeInput={form.reminderChannelTypeInput}
          setReminderChannelTypeInput={form.setReminderChannelTypeInput}
          reminderChannelIdInput={form.reminderChannelIdInput}
          setReminderChannelIdInput={form.setReminderChannelIdInput}
          availableChannels={props.availableChannels}
          reminderRecipientMode={form.reminderRecipientMode}
          setReminderRecipientMode={form.setReminderRecipientMode}
          reminderAllowPrivate={form.reminderAllowPrivate}
          setReminderAllowPrivate={form.setReminderAllowPrivate}
          reminderAllowGroup={form.reminderAllowGroup}
          setReminderAllowGroup={form.setReminderAllowGroup}
          groupPickerRef={form.groupPickerRef}
          showGroupPicker={form.showGroupPicker}
          setShowGroupPicker={form.setShowGroupPicker}
          fetchWaGroups={form.fetchWaGroups}
          loadingWaGroups={form.loadingWaGroups}
          waGroups={form.waGroups}
          reminderRecipientList={form.reminderRecipientList}
          setReminderRecipientList={form.setReminderRecipientList}
          editingRecipientIdx={form.editingRecipientIdx}
          setEditingRecipientIdx={form.setEditingRecipientIdx}
          reminderCountryCode={form.reminderCountryCode}
          setReminderCountryCode={form.setReminderCountryCode}
          getRecipientDisplayInfo={form.getRecipientDisplayInfo}
          blacklistSlot={
            <BlacklistConfig
              channelType={form.reminderChannelTypeInput}
              blacklistList={form.reminderBlacklistList}
              setBlacklistList={form.setReminderBlacklistList}
              editingIdx={form.editingBlacklistIdx}
              setEditingIdx={form.setEditingBlacklistIdx}
              countryCode={form.reminderCountryCode}
              setCountryCode={form.setReminderCountryCode}
              blGroupPickerRef={form.blGroupPickerRef}
              showBlGroupPicker={form.showBlGroupPicker}
              setShowBlGroupPicker={form.setShowBlGroupPicker}
              fetchWaGroups={form.fetchWaGroups}
              waGroups={form.waGroups}
              getDisplayInfo={form.getRecipientDisplayInfo}
            />
          }
        />

        {/* 4. Schedule Settings */}
        <ScheduleConfigSection
          reminderFreqType={form.reminderFreqType}
          setReminderFreqType={form.setReminderFreqType}
          reminderTimezoneInput={form.reminderTimezoneInput}
          setReminderTimezoneInput={form.setReminderTimezoneInput}
          editingReminder={editingReminder}
          reminderTargetDate={form.reminderTargetDate}
          setReminderTargetDate={form.setReminderTargetDate}
          reminderTime={form.reminderTime}
          setReminderTime={form.setReminderTime}
          reminderEndTime={form.reminderEndTime}
          setReminderEndTime={form.setReminderEndTime}
          reminderTimeMode={form.reminderTimeMode}
          setReminderTimeMode={form.setReminderTimeMode}
          reminderDays={form.reminderDays}
          setReminderDays={form.setReminderDays}
          reminderMinInterval={form.reminderMinInterval}
          setReminderMinInterval={form.setReminderMinInterval}
          reminderMaxInterval={form.reminderMaxInterval}
          setReminderMaxInterval={form.setReminderMaxInterval}
          reminderIntervalUnit={form.reminderIntervalUnit}
          setReminderIntervalUnit={form.setReminderIntervalUnit}
          reminderUseTimeWindow={form.reminderUseTimeWindow}
          setReminderUseTimeWindow={form.setReminderUseTimeWindow}
          reminderWindowStartTime={form.reminderWindowStartTime}
          setReminderWindowStartTime={form.setReminderWindowStartTime}
          reminderWindowEndTime={form.reminderWindowEndTime}
          setReminderWindowEndTime={form.setReminderWindowEndTime}
          reminderMinute={form.reminderMinute}
          setReminderMinute={form.setReminderMinute}
          reminderIntervalMinutes={form.reminderIntervalMinutes}
          setReminderIntervalMinutes={form.setReminderIntervalMinutes}
          reminderDayOfMonth={form.reminderDayOfMonth}
          setReminderDayOfMonth={form.setReminderDayOfMonth}
          reminderMaxRunsInput={form.reminderMaxRunsInput}
          setReminderMaxRunsInput={form.setReminderMaxRunsInput}
        />

        {/* 5. Reminder Message Content with Dynamic Clickable Placeholder Tags */}
        <MessageTemplateEditor
          message={form.reminderMessageInput}
          setMessage={form.setReminderMessageInput}
          variables={form.reminderVariables}
        />

        {/* 6. Active Status Toggle */}
        <ReminderActiveToggle
          isActive={form.reminderIsActiveInput}
          setIsActive={form.setReminderIsActiveInput}
        />
      </form>
    </Modal>
  );
}
