export type TutorialStep =
  | "city_intro_0"         // Guide: "Bravo !"
  | "city_intro_1"         // Guide: "Tu as faim ?"
  | "city_intro_2"         // Guide: "Au konbini !"
  | "map_konbini"          // Ring on Lieux sidebar button
  | "lieux_filter_konbini" // Ring on konbini filter in Lieux panel
  | "lieux_select_poi"     // Guide: "Choisis un konbini dans la liste"
  | "pre_lesson_guide"     // Guide: "Commençons par le cours !"
  | "drawer_lesson"        // Ring on lesson button in drawer
  | "lesson_active"        // Lesson in progress (no overlay)
  | "pre_quest_guide"      // Guide: "Mettons en pratique !"
  | "drawer_quest"         // Ring on quest button in drawer
  | "quest_active"         // Quest in progress (no overlay)
  | "quest_done_0"         // Guide: "Bravo !"
  | "quest_done_1"         // Guide: "Tu t'y fais !"
  | "sidebar_lieux"        // Tooltip: Lieux button
  | "sidebar_contacts"     // Tooltip: Contacts button
  | "sidebar_revision"     // Tooltip: Révision button
  | "sidebar_guidage"      // Tooltip: Guidage button
  | "guide_free_0"         // Guide: "Tu es libre !"
  | "guide_free_1"         // Guide: "Explore !"
  | "home_map_0"           // Home: guide on city pins
  | "home_map_1"           // Home: guide on sidebar
  | "home_tickets"         // Home: ring on daily tickets
  | "home_flame"           // Home: ring on streak
  | "home_xp"              // Home: ring on XP ring
  | "home_daily"           // Home: ring on daily objectives
  | "home_nav"             // Home: ring on navigation menu
  | "home_objectif"        // Home: ring on Mon Objectif
  | "home_settings"        // Home: ring on settings
  | "pricing"              // Pricing popup
  | "complete";            // Done forever

const KEY = "sekai_tuto_step";

export function getTutoStep(): TutorialStep | null {
  if (typeof window === "undefined") return null;
  return (localStorage.getItem(KEY) as TutorialStep) ?? null;
}

export function setTutoStep(step: TutorialStep | null) {
  if (typeof window === "undefined") return;
  if (step === null) localStorage.removeItem(KEY);
  else localStorage.setItem(KEY, step);
}

export function initTuto(force = false) {
  const s = getTutoStep();
  if (force || !s || s === "complete") setTutoStep("city_intro_0");
}

// Returns true if we're somewhere in the city tutorial (steps 0–sidebar)
export function isCityTutoActive(s: TutorialStep | null): boolean {
  if (!s) return false;
  const citySteps: TutorialStep[] = [
    "city_intro_0","city_intro_1","city_intro_2",
    "map_konbini","lieux_filter_konbini","lieux_select_poi",
    "pre_lesson_guide","drawer_lesson","lesson_active",
    "pre_quest_guide","drawer_quest","quest_active",
    "quest_done_0","quest_done_1",
    "sidebar_lieux","sidebar_contacts","sidebar_revision","sidebar_guidage",
    "guide_free_0","guide_free_1",
  ];
  return citySteps.includes(s);
}

export function isHomeTutoActive(s: TutorialStep | null): boolean {
  if (!s) return false;
  const homeSteps: TutorialStep[] = [
    "home_map_0", "home_map_1",
    "home_tickets", "home_flame", "home_xp",
    "home_daily", "home_nav", "home_objectif", "home_settings",
  ];
  return homeSteps.includes(s);
}
