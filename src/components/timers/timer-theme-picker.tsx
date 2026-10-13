"use client";

import { SkinPicker } from "@/lib/skins";
import type { ComponentProps } from "react";
import styles from "./timer-layout.module.css";

export function TimerThemePicker(props: ComponentProps<typeof SkinPicker>) {
  return (
    <details className={styles.theme}>
      <summary>Theme</summary>
      <SkinPicker {...props} />
    </details>
  );
}
