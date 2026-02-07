import { ReactNode } from "react";

export interface CrudStepperStep {
  label: string;
  content: ReactNode;
  optional?: boolean;
}

export interface CrudStepperDialogProps {
  open: boolean;
  onClose: () => void;
  title: string;
  steps: CrudStepperStep[];
  onSave: () => void | Promise<void>;
  saveLabel?: string;
  cancelLabel?: string;
  disableSave?: boolean;
}

declare const CrudStepperDialog: React.FC<CrudStepperDialogProps>;
export default CrudStepperDialog;
