import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { ChevronDown } from "lucide-react";

interface SearchSource {
  id: string;
  name: string;
  icon?: string;
}

interface SearchSourceSelectorProps {
  sources: SearchSource[];
  selected: string[];
  onSelectionChange: (sources: string[]) => void;
}

const DEFAULT_SOURCES: SearchSource[] = [
  { id: "arxiv", name: "arXiv" },
  { id: "pubmed", name: "PubMed" },
  { id: "scholar", name: "Google Scholar" },
  { id: "ieee", name: "IEEE Xplore" },
  { id: "springer", name: "Springer" },
  { id: "sciencedirect", name: "ScienceDirect" },
];

export default function SearchSourceSelector({
  sources = DEFAULT_SOURCES,
  selected,
  onSelectionChange,
}: SearchSourceSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);

  const handleToggle = (sourceId: string) => {
    const newSelected = selected.includes(sourceId)
      ? selected.filter((id) => id !== sourceId)
      : [...selected, sourceId];
    onSelectionChange(newSelected);
  };

  const selectedNames = sources
    .filter((s) => selected.includes(s.id))
    .map((s) => s.name)
    .join(", ");

  return (
    <div className="relative">
      <Button
        variant="outline"
        className="w-full justify-between"
        onClick={() => setIsOpen(!isOpen)}
      >
        <span className="truncate text-sm">
          {selectedNames || "Select sources..."}
        </span>
        <ChevronDown className={`w-4 h-4 transition-transform ${isOpen ? "rotate-180" : ""}`} />
      </Button>

      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-popover border border-border rounded-lg shadow-lg p-3 z-50 space-y-2">
          {sources.map((source) => (
            <label
              key={source.id}
              className="flex items-center gap-2 cursor-pointer hover:bg-muted p-2 rounded transition-colors"
            >
              <Checkbox
                checked={selected.includes(source.id)}
                onCheckedChange={() => handleToggle(source.id)}
              />
              <span className="text-sm">{source.name}</span>
            </label>
          ))}
        </div>
      )}

      {isOpen && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setIsOpen(false)}
        />
      )}
    </div>
  );
}
