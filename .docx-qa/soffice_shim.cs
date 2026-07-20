using System;
using System.IO;
using System.Runtime.InteropServices;

public static class Program
{
    public static int Main(string[] args)
    {
        string outputDirectory = null;
        string format = null;
        for (int i = 0; i < args.Length - 1; i++)
        {
            if (args[i] == "--outdir") outputDirectory = args[i + 1];
            if (args[i] == "--convert-to") format = args[i + 1];
        }

        if (args.Length == 0 || string.IsNullOrWhiteSpace(outputDirectory) || format != "pdf")
        {
            return 2;
        }

        string input = Path.GetFullPath(args[args.Length - 1]);
        string output = Path.Combine(
            Path.GetFullPath(outputDirectory),
            Path.GetFileNameWithoutExtension(input) + ".pdf"
        );

        object wordObject = null;
        object documentObject = null;
        try
        {
            Type wordType = Type.GetTypeFromProgID("Word.Application");
            if (wordType == null) return 3;
            wordObject = Activator.CreateInstance(wordType);
            dynamic word = wordObject;
            word.Visible = false;
            word.DisplayAlerts = 0;
            dynamic document = word.Documents.Open(input, false, true, false);
            documentObject = document;
            document.Repaginate();
            document.ExportAsFixedFormat(output, 17);
            document.Close(false);
            documentObject = null;
            word.Quit(false);
            wordObject = null;
            Console.WriteLine("Converted " + input + " to " + output);
            return File.Exists(output) ? 0 : 4;
        }
        catch (Exception error)
        {
            Console.Error.WriteLine(error.ToString());
            return 5;
        }
        finally
        {
            if (documentObject != null)
            {
                try { ((dynamic)documentObject).Close(false); } catch { }
                try { Marshal.FinalReleaseComObject(documentObject); } catch { }
            }
            if (wordObject != null)
            {
                try { ((dynamic)wordObject).Quit(false); } catch { }
                try { Marshal.FinalReleaseComObject(wordObject); } catch { }
            }
            GC.Collect();
            GC.WaitForPendingFinalizers();
        }
    }
}
