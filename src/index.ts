/** Host half: the browser bundle is the actual theme implementation. */
export function apply(): void {
  // Intentionally empty. Keeping a host entry lets DSH mount the package as
  // an out-of-tree profile bundle without adding Host services or persistence.
}
