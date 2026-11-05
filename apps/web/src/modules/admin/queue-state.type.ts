/** URL-backed state of an admin queue (status chip + selected item), passed from the page to queue components. */
export interface QueueState {
  status: string | undefined;
  item: string | undefined;
  setStatus: (status: string | undefined) => void;
  setItem: (item: string) => void;
}
