import type { FC } from 'react';

/**
 * Premium Book Loader Component
 * A high-fidelity CSS animation representing a flipping book,
 * tailored for educational and exam preparation contexts.
 */
const Loader: FC = () => {
  return (
    <div className="book-loader-container">
      <div className="book">
        <div className="book__pg-shadow" />
        <div className="book__pg" />
        <div className="book__pg book__pg--2" />
        <div className="book__pg book__pg--3" />
        <div className="book__pg book__pg--4" />
        <div className="book__pg book__pg--5" />
      </div>
    </div>
  );
};

export default Loader;
