import BirthdayCard from '../ui/birthday-card';

const card = {
  recipient: 'Aarav',
  wishes: [
    { id: 'cake', sender: 'Isha', photo: '/demo/cake.jpg', message: 'Remember the cake that melted on the way to your flat? You called it pudding and gave everybody a spoon. Life is better with you in it.' },
    { id: 'goa', sender: 'Rohan', message: 'That Goa trip has been “next month” for three years. This is the year it leaves the group chat, birthday boy.' },
    { id: 'chai', sender: 'Kabir', photo: '/demo/chai.jpg', message: 'Here’s to midnight chai and terrace talks that turn into sunrise. Happy birthday, yaar.' },
    { id: 'playlist', sender: 'Tara', message: 'You made a playlist for our ten-minute auto ride. It’s still my favourite playlist.' },
    { id: 'first', sender: 'Nisha', message: 'First day of college, you saved me a seat. Somehow we’re still saving seats for each other.' },
    { id: 'heart', sender: 'Meera', message: 'You show up for the big things and the ordinary days. I hope this year gives you that same kind of love back.' }
  ],
  storyboard: {
    title: 'The case for Aarav',
    intro: 'Six friends. A melted cake, midnight chai, and a Goa plan still stuck in the group chat.',
    scenes: [
      { id: 'cake', caption: 'The melted cake incident' },
      { id: 'goa', caption: 'The great Goa plan' },
      { id: 'chai', caption: 'Midnight chai club' },
      { id: 'playlist', caption: 'The auto ride playlist' },
      { id: 'first', caption: 'A seat saved' },
      { id: 'heart', caption: 'The part that matters' }
    ]
  }
};

export default function Demo() {
  return <BirthdayCard card={card} demo />;
}
