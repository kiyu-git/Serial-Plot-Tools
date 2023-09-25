// import { Box, Flex, Heading, Tag, Text } from '@chakra-ui/react';
import Plot from 'react-plotly.js';

export function DataViewer() {
  // const onDragOver = (e: React.DragEvent<HTMLDivElement>) => {
  //   e.stopPropagation();
  //   e.preventDefault();
  // };

  // const onDrop = (e: React.DragEvent<HTMLDivElement>) => {
  //   e.stopPropagation();
  //   e.preventDefault();
  //   const file = e.dataTransfer.files[0];
  //   showPlot(file.path);
  // };

  // const openFileDialog = async () => {
  //   const filepath = await window.api.openFileDialog();
  //   showPlot(filepath);
  // };

  // const showPlot = async (path: string) => {
  //   const [header, data] = await window.api.loadData(path);
  //   console.log(data);
  // };

  return (
    <Plot
      data={[
        {
          x: [1, 2, 3],
          y: [2, 6, 3],
          type: 'scatter',
          mode: 'lines+markers',
          marker: { color: 'red' },
        },
        { type: 'bar', x: [1, 2, 3], y: [2, 5, 3] },
      ]}
      layout={{ width: 320, height: 240, title: 'A Fancy Plot' }}
    />
    // <Box mx={3}>
    //   <Box>
    //     <Heading>Data Viewer</Heading>
    //     <Text>Realtime Data Loggerで保存したデータをグラフにします</Text>
    //   </Box>
    //   <Flex my={3} color="white">
    //     <Box w={'20%'} bg="blue">
    //       <Box
    //         border="3px"
    //         borderStyle="dotted"
    //         borderColor={'crimson'}
    //         onDragOver={(e) => onDragOver(e)}
    //         onDrop={(e) => onDrop(e)}
    //       >
    //         ここにファイルをドロップ
    //         <br />
    //         または<Tag onClick={openFileDialog}>ファイルを開く</Tag>
    //       </Box>
    //     </Box>
    //     <Box flex="1" bg="tomato"></Box>
    //   </Flex>
    // </Box>
  );
}
