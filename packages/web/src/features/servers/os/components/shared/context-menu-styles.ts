/** Shared visual language for the desktop's popover context menus (Dock icons,
 * desktop icons, widgets). `desktop-context-menu.tsx` (the plain background menu,
 * no destructive items) keeps its own slightly different local variant. */

export const panelClass =
  "rounded-[8px] py-[5px] border-[0.5px] border-white/[0.13] shadow-[0_24px_60px_rgba(0,0,0,0.45),0_2px_8px_rgba(0,0,0,0.2),inset_0_0.5px_0_rgba(255,255,255,0.08)] bg-[rgba(30,30,30,0.72)] backdrop-blur-[60px] backdrop-saturate-[1.7]";

export const itemBase =
  "flex items-center mx-[4px] px-[10px] h-[24px] rounded-[5px] cursor-default select-none text-[13px] leading-[24px] tracking-[-0.08px] transition-colors duration-75";
