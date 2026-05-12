import { Button } from "@/components/ui/button";
import { FileText, Upload, Link2 } from "lucide-react";

interface FileUploadMenuProps {
  onClose: () => void;
}

export default function FileUploadMenu({ onClose }: FileUploadMenuProps) {
  return (
    <div className="absolute bottom-full left-0 mb-2 bg-popover border border-border rounded-lg shadow-lg p-2 min-w-48 z-50">
      <div className="space-y-1">
        <Button
          variant="ghost"
          className="w-full justify-start gap-2"
          onClick={() => {
            // TODO: Handle PDF upload
            onClose();
          }}
        >
          <FileText className="w-4 h-4" />
          Upload PDF
        </Button>
        <Button
          variant="ghost"
          className="w-full justify-start gap-2"
          onClick={() => {
            // TODO: Handle file upload
            onClose();
          }}
        >
          <Upload className="w-4 h-4" />
          Upload File
        </Button>
        <Button
          variant="ghost"
          className="w-full justify-start gap-2"
          onClick={() => {
            // TODO: Handle URL input
            onClose();
          }}
        >
          <Link2 className="w-4 h-4" />
          Paste URL
        </Button>
      </div>
    </div>
  );
}
