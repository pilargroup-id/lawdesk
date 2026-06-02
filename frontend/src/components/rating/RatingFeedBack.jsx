import Rating from '@mui/material/Rating';

export default function FeedbackRating({value}) {
  return <Rating name="read-only" value={value} readOnly />;
}