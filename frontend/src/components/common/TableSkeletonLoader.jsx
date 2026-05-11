import React from 'react';
import './TableSkeletonLoader.css';

const TableSkeletonLoader = ({ rows = 5, columns = 6 }) => {
  return (
    <>
      {[...Array(rows)].map((_, rowIndex) => (
        <tr key={rowIndex} className="skeleton-row">
          {[...Array(columns)].map((_, colIndex) => (
            <td key={colIndex}>
              <div className="skeleton-cell">
                <div className="skeleton-line"></div>
              </div>
            </td>
          ))}
        </tr>
      ))}
    </>
  );
};

export default TableSkeletonLoader;
