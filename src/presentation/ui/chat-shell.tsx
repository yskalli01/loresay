import { Bot, Send } from "lucide-react";

import { Button } from "./button";
import { Card } from "./card";
import { Label } from "./label";
import { Textarea } from "./input";

export function ChatShellPreview() {
  return (
    <Card className="p-5">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-md bg-accent text-on-accent">
          <Bot className="h-5 w-5" aria-hidden="true" />
        </div>
        <div>
          <h2 className="text-base font-semibold text-ink">
            Ask your knowledge
          </h2>
          <p className="text-sm text-body">Answers will cite saved sources.</p>
        </div>
      </div>
      <div className="mt-5 rounded-md border border-border-subtle bg-surface-subtle p-4">
        <p className="text-sm leading-6 text-body">
          Start with a question about your saved notes, documents, or links. The
          first live chat path lands in the thin knowledge loop.
        </p>
      </div>
      <form className="mt-5 space-y-3">
        <Label htmlFor="chat-preview">Question</Label>
        <Textarea
          disabled
          id="chat-preview"
          placeholder="What did I save about retrieval quality?"
        />
        <Button disabled icon={<Send className="h-4 w-4" />}>
          Ask once sources are connected
        </Button>
      </form>
    </Card>
  );
}
