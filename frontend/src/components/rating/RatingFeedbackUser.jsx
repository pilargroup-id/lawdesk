import * as React from 'react';
import Rating from '@mui/material/Rating';

export default function BasicRating() {
  const [value, setValue] = React.useState(2);

  return (
    <Rating
      name="rating-controlled"
      value={value}
      onChange={(event, newValue) => {
        setValue(newValue);
      }}
    />
  );
}