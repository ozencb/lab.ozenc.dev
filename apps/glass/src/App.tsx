import './App.css';
import { Scene } from './components';

function App() {
  const text = `Lorem ipsum dolor sit amet, consectetur adipiscing elit. Aenean
  bibendum, tellus tincidunt varius rhoncus, nibh neque condimentum est,
  sed bibendum sapien est at nibh. Morbi diam diam, scelerisque eu augue
  vel, aliquam vehicula arcu. Vivamus urna erat, viverra ac facilisis a,
  mattis nec augue. Curabitur at pharetra libero. Integer nec turpis
  felis. Vestibulum blandit sem et lectus bibendum, eu dictum dolor
  consequat. Quisque mauris orci, placerat non mauris ut, vehicula
  pellentesque massa. Nullam justo ligula, dictum in sem ut, vehicula
  ornare libero. Praesent in diam non urna scelerisque accumsan.
  Suspendisse pretium massa massa, ac sagittis quam pharetra ac. Proin
  molestie dictum tempus. Nulla velit lacus, commodo non est sed,
  egestas ultrices sapien. Cras dapibus sagittis pulvinar. Maecenas
  tempor, arcu sit amet accumsan accumsan, felis velit venenatis dolor,
  vel convallis lorem nibh ut neque. Duis auctor ligula a ante tempor,
  in consectetur ante convallis. Morbi tellus ex, suscipit a dictum et,
  blandit eget nulla. Aenean a malesuada ligula, quis ultrices sapien.
  Interdum et malesuada fames ac ante ipsum primis in faucibus.
  Curabitur eget efficitur lacus, in auctor massa. Sed imperdiet urna
  nec magna ultricies, a fringilla metus tempus. Nunc vitae pulvinar
  lorem. Fusce erat eros, euismod in lacinia cursus, elementum consequat
  urna. Phasellus bibendum arcu laoreet nisl tristique luctus. Quisque
  sollicitudin molestie molestie. Donec sed tincidunt elit, nec ultrices
  eros. Nam tincidunt lorem ut venenatis sodales. Aliquam sit amet
  tempus quam. Duis tristique mauris quis tortor imperdiet consectetur.
  Duis euismod, enim non condimentum vulputate, felis velit tristique
  enim, ac porttitor felis ligula in risus. Nunc sit amet erat
  tincidunt, iaculis leo ut, feugiat nisl. Quisque lacinia ante aliquam
  nunc semper bibendum. In at porttitor lorem. Quisque lacus odio,
  vehicula ultricies odio a, commodo tempor nunc. In sed molestie magna.
  Integer eu interdum sapien. Fusce condimentum augue nec porta
  tristique. Aenean eu lectus leo. Lorem ipsum dolor sit amet,
  consectetur adipiscing elit. Sed volutpat augue eget sapien tempor
  consectetur. Pellentesque in nulla eu lectus porttitor dapibus. Morbi
  pharetra dui at diam volutpat, a cursus nunc bibendum. Phasellus felis
  eros, porttitor sed dignissim at, luctus quis odio. Nunc placerat
  justo sit amet erat sagittis, nec aliquam elit dictum. Curabitur
  interdum tempor dolor non aliquam. Suspendisse congue enim ut sapien
  fermentum ornare. Nullam scelerisque, erat ac hendrerit dignissim,
  purus tellus facilisis augue, a lobortis diam urna vel felis. In hac
  habitasse platea dictumst. Suspendisse vel tellus eu arcu pharetra
  rhoncus. Vestibulum mollis viverra nulla vel eleifend. Mauris dui
  tellus, efficitur ac dui id, ornare viverra velit. Mauris lacinia
  fermentum auctor. Ut volutpat tellus vel efficitur interdum. Nulla
  porttitor vehicula malesuada. Vivamus nec sapien quis tellus ornare
  eleifend sit amet convallis dolor. Proin a mauris vel nunc accumsan
  luctus eu et nunc. Phasellus vehicula eu ipsum non sodales. Fusce leo
  dolor, lobortis vel semper non, vulputate sed ante. Sed tempor, quam
  id cursus laoreet, nunc nisi faucibus risus, quis tempus lorem tellus
  et mauris. Quisque nec est non libero faucibus suscipit. Quisque
  bibendum augue dictum commodo fermentum. Donec pharetra et magna vel
  tincidunt.`;

  return (
    <>
      <main id='main' className='main'>
        <img className='gif' src='../world.gif' alt='Example Image' />
        <div className='content'>{text.repeat(20)}</div>
      </main>
      <Scene size={240} />
    </>
  );
}

export default App;
