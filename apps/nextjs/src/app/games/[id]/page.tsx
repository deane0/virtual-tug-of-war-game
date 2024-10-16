"use client";

import { useEffect, useState } from "react";

import { Button } from "@acme/ui/button";
import { Separator } from "@acme/ui/separator";
import { toast } from "@acme/ui/toast";

import { trpc } from "~/trpc/ws-client";

export interface GamePageProps {
  params: { id: string };
}

function GamePage({ params }: GamePageProps) {
  const [offset, setOffset] = useState(0);

  const isTyping = trpc.game.isTyping.useMutation();

  const handleClick = () => {
    if (Math.abs(offset) >= 100) return;
    isTyping.mutate({
      id: params.id,
      user: "UserLeft",
      offset: offset - 10,
      typing: true,
    });
  };

  const handleClickRight = () => {
    if (Math.abs(offset) >= 100) return;
    isTyping.mutate({
      id: params.id,
      user: "UserRight",
      offset: offset + 10,
      typing: true,
    });
  };

  const handleReset = () => {
    isTyping.mutate({
      id: params.id,
      user: "",
      offset: 0,
      typing: true,
    });
  };

  useEffect(() => {
    if (offset >= 100) {
      toast.success("Right Win");
    }

    if (offset <= -100) {
      toast.success("Left Win");
    }
  }, [offset]);

  trpc.game.onOffsetChange.useSubscription(
    { id: params.id },
    {
      onData(data) {
        console.log(data);
        setOffset(data.offset);
      },
      onStarted() {
        console.log("started");
      },
    },
  );

  return (
    <>
      <div className="container">
        <div className="flex h-96">
          <div className="relative flex flex-1 flex-col items-center justify-center">
            <div
              className="h-2 w-full transform rounded-l-full bg-slate-800"
              style={{ translate: `${offset}px` }}
            />
            <div className="mt-12">
              <Button onClick={handleClick}>Pull</Button>
            </div>
            <Separator
              orientation="vertical"
              className="absolute right-[100px] bg-green-600"
            />
          </div>
          <Separator orientation="vertical" />
          <div className="relative flex flex-1 flex-col items-center justify-center">
            <Separator
              orientation="vertical"
              className="absolute left-[100px] bg-green-600"
            />
            <div
              className="h-2 w-full rounded-r-full bg-slate-800"
              style={{ translate: `${offset}px` }}
            />
            <div className="mt-12">
              <Button onClick={handleClickRight}>Pull</Button>
            </div>
          </div>
        </div>
        <div className="flex justify-center">
          <Button onClick={handleReset}>Reset</Button>
        </div>
      </div>
    </>
  );
}

export default trpc.withTRPC(GamePage);
