import select from "select-dom";
import "webext-dynamic-content-scripts";

import { initAll } from "features";
import "features/extend-file-types-filter";

initAll();

// Add global for easier debugging
(window as AnyObject).select = select;
