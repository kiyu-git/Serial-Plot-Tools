import { DownloadIcon } from '@chakra-ui/icons';
import { Box, Center, Grid, GridItem, Heading, Text } from '@chakra-ui/react';
import { Data, Layout } from 'plotly.js';
import React, { useState } from 'react';
import Plot from 'react-plotly.js';
import styles from './index.module.scss';

type plotData = {
  x: Date[];
  y: number[];
  title: string;
};

export default function DataViewer() {
  const [plotData, setPlotData] = useState<plotData[]>([]);
  const [fileName, setFileName] = useState<string>('');

  const showPlot = async (path: string) => {
    setFileName(path);
    const [header, data] = await window.api.loadData(path);
    const formatData: plotData[] = [];
    const datetimeData = data[0].map((strDatetime: string) => {
      return new Date(strDatetime);
    });
    for (let i = 1; i < header.length; i++) {
      formatData.push({ title: header[i], x: datetimeData, y: data[i] });
    }

    setPlotData(formatData);
  };

  const onDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.stopPropagation();
    e.preventDefault();
  };

  const onDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.stopPropagation();
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    showPlot(file.path);
  };

  const openFileDialog = async () => {
    const filepath = await window.api.openFileDialog();
    if (filepath === undefined) return;
    showPlot(filepath);
  };

  return (
    <Grid
      mx={3}
      templateAreas={`"header header" "nav main"`}
      gridTemplateRows="auto 1fr"
      gridTemplateColumns="20% 1fr"
      h="100vh"
      margin={0}
      padding={2}
    >
      <GridItem area="header" margin="0 0 1em 0">
        <Heading>Data Viewer</Heading>
        <Text>Realtime Data Loggerで保存したデータをグラフにします。</Text>
      </GridItem>
      <GridItem area="nav">
        <Box bgColor="white">
          <Heading fontSize="xl" mb={1}>
            Select Data File
          </Heading>
          <Box
            w="100%"
            cursor="pointer"
            padding={1}
            borderWidth="1px"
            borderRadius="md"
            color="teal.600"
            borderColor="teal.600"
            minH="150px"
            _hover={{ background: 'teal.50' }}
            onDragOver={(e) => onDragOver(e)}
            onDrop={(e) => onDrop(e)}
            onClick={openFileDialog}
          >
            <Box>
              <Text>Drag and drop file here</Text>
              <Center>
                <DownloadIcon boxSize={5} m={2} />
              </Center>
              <Text fontSize="sm">{fileName}</Text>
            </Box>
          </Box>
        </Box>
      </GridItem>
      <GridItem bg="" overflowX="auto" overflowY="scroll" area="main">
        {plotData?.map((data) => {
          return (
            <Plot
              className={styles.plot}
              key={data.title}
              data={
                [
                  {
                    x: data.x,
                    y: data.y,
                    type: 'scatter',
                    mode: 'lines',
                  },
                ] as Data[]
              }
              layout={
                {
                  xaxis: { title: '時刻' },
                  yaxis: { title: data.title },
                  title: '',
                  margin: { t: 0 },
                } as Partial<Layout>
              }
            />
          );
        })}
      </GridItem>
    </Grid>
  );
}
