import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { FileText, Upload, Link2, X } from "lucide-react";
import { toast } from "sonner";

interface FileUploadDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onFileUpload?: (file: File) => void;
  onUrlSubmit?: (url: string) => void;
}

export default function FileUploadDialog({
  isOpen,
  onClose,
  onFileUpload,
  onUrlSubmit,
}: FileUploadDialogProps) {
  const [uploadMode, setUploadMode] = useState<"file" | "url" | null>(null);
  const [url, setUrl] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    const validTypes = ["application/pdf", "text/plain", "application/msword"];
    if (!validTypes.includes(file.type)) {
      toast.error("Please upload a PDF, text, or Word document");
      return;
    }

    // Validate file size (max 50MB)
    if (file.size > 50 * 1024 * 1024) {
      toast.error("File size must be less than 50MB");
      return;
    }

    setIsLoading(true);
    try {
      onFileUpload?.(file);
      toast.success("File uploaded successfully");
      onClose();
    } catch (error) {
      toast.error("Failed to upload file");
    } finally {
      setIsLoading(false);
    }
  };

  const handleUrlSubmit = async () => {
    if (!url.trim()) {
      toast.error("Please enter a valid URL");
      return;
    }

    try {
      new URL(url); // Validate URL format
    } catch {
      toast.error("Please enter a valid URL");
      return;
    }

    setIsLoading(true);
    try {
      onUrlSubmit?.(url);
      toast.success("URL submitted successfully");
      onClose();
    } catch (error) {
      toast.error("Failed to process URL");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Upload Files or Add URL</DialogTitle>
        </DialogHeader>

        {uploadMode === null && (
          <div className="space-y-2">
            <Button
              variant="outline"
              className="w-full justify-start gap-2 h-auto p-4"
              onClick={() => setUploadMode("file")}
            >
              <FileText className="w-5 h-5" />
              <div className="text-left">
                <div className="font-medium">Upload PDF or Document</div>
                <div className="text-xs text-muted-foreground">
                  Max 50MB - PDF, TXT, or DOCX
                </div>
              </div>
            </Button>

            <Button
              variant="outline"
              className="w-full justify-start gap-2 h-auto p-4"
              onClick={() => setUploadMode("url")}
            >
              <Link2 className="w-5 h-5" />
              <div className="text-left">
                <div className="font-medium">Add URL</div>
                <div className="text-xs text-muted-foreground">
                  Paste a link to a paper or website
                </div>
              </div>
            </Button>
          </div>
        )}

        {uploadMode === "file" && (
          <div className="space-y-4">
            <div className="border-2 border-dashed border-border rounded-lg p-8 text-center cursor-pointer hover:bg-muted transition-colors"
              onClick={() => fileInputRef.current?.click()}
            >
              <Upload className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
              <p className="text-sm font-medium">Click to upload or drag and drop</p>
              <p className="text-xs text-muted-foreground">PDF, TXT, or DOCX (max 50MB)</p>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,.txt,.doc,.docx"
              onChange={handleFileSelect}
              className="hidden"
              disabled={isLoading}
            />
            <Button
              variant="outline"
              className="w-full"
              onClick={() => setUploadMode(null)}
            >
              Back
            </Button>
          </div>
        )}

        {uploadMode === "url" && (
          <div className="space-y-4">
            <Input
              placeholder="https://example.com/paper.pdf"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              disabled={isLoading}
            />
            <div className="flex gap-2">
              <Button
                className="flex-1"
                onClick={handleUrlSubmit}
                disabled={isLoading}
              >
                {isLoading ? "Processing..." : "Submit"}
              </Button>
              <Button
                variant="outline"
                onClick={() => setUploadMode(null)}
                disabled={isLoading}
              >
                Back
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
