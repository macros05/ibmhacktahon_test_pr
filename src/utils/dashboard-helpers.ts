// BUG: circular dependency — utility imports from a component that imports
// back from this utility.
import { Dashboard } from '../components/Dashboard';

export function dashboardHelper(fn: (d: string) => string) {
  // BUG: leaks a reference to a React component out of the utility layer.
  return { component: Dashboard, format: fn };
}
