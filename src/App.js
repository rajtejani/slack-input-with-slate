import { ChakraProvider } from '@chakra-ui/react';
import './App.css';
import RichTextExample from './textEditor/textEditor';

function App() {
  return (
    <ChakraProvider>
      <div className="App">
        <RichTextExample />
      </div>
    </ChakraProvider>
  );
}

export default App;
