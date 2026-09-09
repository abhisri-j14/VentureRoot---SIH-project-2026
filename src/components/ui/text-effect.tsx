"use client";

import { motion, Variants } from "framer-motion";
import React from "react";

interface TextEffectProps {
  children: React.ReactNode;
  per?: "char" | "word";
  preset?: "fade" | "blur" | "slide";
  trigger?: boolean;
}

export function TextEffect({ children, per = "char", preset = "fade", trigger = true }: TextEffectProps) {
  const container: Variants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: per === "char" ? 0.03 : 0.08,
      },
    },
  };

  const item: Variants = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { duration: 0.4, ease: "easeOut" } },
  };

  const renderText = (text: string, keyPrefix: string) => {
    const words = text.split(" ");
    
    if (per === "word") {
      return words.map((word, index) => (
        <React.Fragment key={`${keyPrefix}-${index}`}>
          <motion.span variants={item} className="inline-block whitespace-nowrap">
            {word}
          </motion.span>
          {index < words.length - 1 && "\u00A0"}
        </React.Fragment>
      ));
    }

    // per === "char": wrap each word in whitespace-nowrap so words never split in the middle
    return words.map((word, wIdx) => (
      <React.Fragment key={`${keyPrefix}-w-${wIdx}`}>
        <span className="inline-block whitespace-nowrap">
          {word.split("").map((char, cIdx) => (
            <motion.span key={`${keyPrefix}-${wIdx}-${cIdx}`} variants={item} className="inline-block">
              {char}
            </motion.span>
          ))}
        </span>
        {wIdx < words.length - 1 && "\u00A0"}
      </React.Fragment>
    ));
  };

  const renderChildren = (node: React.ReactNode, keyPrefix = "0"): React.ReactNode => {
    if (typeof node === "string") {
      return renderText(node, keyPrefix);
    }
    
    if (Array.isArray(node)) {
      return node.map((child, index) => renderChildren(child, `${keyPrefix}-${index}`));
    }
    
    if (React.isValidElement(node)) {
      if (node.type === "br") {
        return <br key={keyPrefix} />;
      }
      return <motion.span key={keyPrefix} variants={item} className="inline-block">{node}</motion.span>;
    }
    
    return node;
  };

  return (
    <motion.span
      variants={container}
      initial="hidden"
      animate={trigger ? "show" : "hidden"}
      className="inline-block"
    >
      {renderChildren(children)}
    </motion.span>
  );
}
