import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

type Props = {
  headers: string[];

  rows: Record<string, unknown>[];
};

export function RawPreviewTable({ headers, rows }: Props) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Vista previa</CardTitle>
      </CardHeader>

      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>#</TableHead>

                {headers.map((header) => (
                  <TableHead key={header} className="min-w-[150px]">
                    {header}
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>

            <TableBody>
              {rows.map((row, index) => (
                <TableRow key={index}>
                  <TableCell>{index + 2}</TableCell>

                  {headers.map((header) => (
                    <TableCell key={header}>
                      {String(row[header] ?? "")}
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
