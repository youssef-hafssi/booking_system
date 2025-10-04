import React from 'react';
import { cn } from '../../utils/cn';

const TableHeader = ({ children, className, ...props }) => {
  return (
    <thead className={cn("bg-gray-50 dark:bg-gray-800/50", className)} {...props}>
      {children}
    </thead>
  );
};

const TableBody = ({ children, className, ...props }) => {
  return (
    <tbody 
      className={cn("divide-y divide-gray-200 dark:divide-gray-700", className)} 
      {...props}
    >
      {children}
    </tbody>
  );
};

const TableRow = ({ children, className, ...props }) => {
  return (
    <tr 
      className={cn(
        "hover:bg-gray-50 dark:hover:bg-gray-800/60 transition-colors duration-150",
        className
      )} 
      {...props}
    >
      {children}
    </tr>
  );
};

const TableHeaderCell = ({ children, className, ...props }) => {
  return (
    <th 
      className={cn(
        "px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider",
        className
      )} 
      {...props}
    >
      {children}
    </th>
  );
};

const TableCell = ({ children, className, ...props }) => {
  return (
    <td 
      className={cn(
        "px-4 py-3 text-sm text-gray-900 dark:text-gray-100",
        className
      )} 
      {...props}
    >
      {children}
    </td>
  );
};

const TableFooter = ({ children, className, ...props }) => {
  return (
    <tfoot 
      className={cn(
        "bg-gray-50 dark:bg-gray-800/50",
        className
      )} 
      {...props}
    >
      {children}
    </tfoot>
  );
};

const Table = ({ children, className, ...props }) => {
  return (
    <div className="overflow-x-auto">
      <table 
        className={cn(
          "min-w-full divide-y divide-gray-200 dark:divide-gray-700",
          className
        )} 
        {...props}
      >
        {children}
      </table>
    </div>
  );
};

// Attach sub-components to Table
Table.Header = TableHeader;
Table.Body = TableBody;
Table.Row = TableRow;
Table.HeaderCell = TableHeaderCell;
Table.Cell = TableCell;
Table.Footer = TableFooter;

export default Table; 